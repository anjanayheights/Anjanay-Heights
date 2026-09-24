import { get, list, put } from '@vercel/blob';

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';
const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`;
const PREFIX = 'crm/social/instagram-published.json';

function json(res: any, status: number, body: unknown) {
  return res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}
function header(req: any, name: string) {
  return String(req?.headers?.[name.toLowerCase()] || req?.headers?.[name] || '');
}
function authorized(req: any) {
  const secret = process.env.CRON_SECRET || '';
  return !secret || header(req, 'authorization') === `Bearer ${secret}`;
}
const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];
async function withBlobAuth<T>(op: (auth: Record<string,string>) => Promise<T>) {
  let last: any = new Error('Blob credentials unavailable');
  for (const auth of blobAuthCandidates) {
    try { return await op(auth); } catch (e) { last = e; }
  }
  throw last;
}
async function loadPublished(): Promise<Record<string, any>> {
  try {
    const page = await withBlobAuth(a => list({ prefix: PREFIX, ...a }));
    const blob = page.blobs?.[0];
    if (!blob) return {};
    const r = await withBlobAuth(a => get(blob.url, { access: 'private', useCache: false, ...a }));
    if (!r?.stream) return {};
    return await new Response(r.stream).json();
  } catch { return {}; }
}
async function savePublished(value: Record<string, any>) {
  await withBlobAuth(a => put(PREFIX, JSON.stringify(value), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true,
    contentType: 'application/json', ...a
  }));
}
function caption(p: any) {
  return [
    `🔥 ${p.title}`,
    `📍 ${p.location}`,
    p.propertyType ? `🏠 ${p.propertyType}` : '',
    p.bedrooms ? `🛏️ ${p.bedrooms}` : '',
    p.area ? `📐 ${p.area}` : '',
    p.price ? `💰 ${p.price}` : '',
    '',
    'Verified Anjanay Heights inventory.',
    'WhatsApp / Call: +91 92897 71222',
    'DM for availability & site visit.'
  ].filter(Boolean).join('\\n');
}
async function metaPost(path: string, body: Record<string,string>) {
  const r = await fetch(`${GRAPH_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.error) throw new Error(data?.error?.message || `Instagram API error ${r.status}`);
  return data;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' });

  const token = process.env.INSTAGRAM_ACCESS_TOKEN || '';
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID || '';
  if (!token || !accountId) return json(res, 503, { ok: false, error: 'Instagram publishing is not configured.' });

  try {
    const endpoint = 'https://anjanayheights-9m6i.vercel.app/api/inventory-public';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';
    const sr = await fetch(endpoint, { headers: { 'Cache-Control': 'no-cache' } });
    if (!sr.ok) throw new Error(`Inventory unavailable (${sr.status})`);
    const inventory = await sr.json();
    const rows: any[] = Array.isArray(inventory?.properties) ? inventory.properties : [];
    const published = await loadPublished();
    const candidates = rows.map(p => ({
      id: String(p.id),
      title: String(p.name || p.title || 'Property'),
      location: String(p.location || ''),
      propertyType: String(p.property_type || p.propertyType || ''),
      price: String(p.price || ''),
      area: String(p.area || ''),
      bedrooms: String(p.configuration || p.bedrooms || ''),
      photo: typeof p.photos_url === 'string' && /\\.(jpe?g|png|webp|avif)(\\?.*)?$/i.test(p.photos_url.trim()) ? p.photos_url.trim() : '',
      hotScore: Number(p.hot_score || 0)
    })).filter(p => p.id && p.photo && !published[p.id]);

    if (!candidates.length) return json(res, 200, {
      ok: true, posted: false,
      reason: 'No new verified public property with a valid image is ready for Instagram.',
      candidatesChecked: rows.length
    });

    const p = candidates[0];
    const created = await metaPost(`${accountId}/media`, {
      image_url: p.photo, caption: caption(p), access_token: token
    });
    const publishedMedia = await metaPost(`${accountId}/media_publish`, {
      creation_id: String(created.id), access_token: token
    });

    published[p.id] = {
      mediaId: String(publishedMedia.id || created.id),
      postedAt: new Date().toISOString(),
      title: p.title
    };
    await savePublished(published);

    return json(res, 200, {
      ok: true, posted: true, propertyId: p.id, title: p.title,
      mediaId: String(publishedMedia.id || created.id)
    });
  } catch (e: any) {
    console.error('instagram-auto-post error', e);
    return json(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
