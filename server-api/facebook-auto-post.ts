import { get, list, put } from '@vercel/blob';

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v26.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const PREFIX = 'crm/social/facebook-published.json';

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
function absoluteUrl(value: string, base: string) {
  try { return new URL(value, base).toString(); } catch { return ''; }
}
function isImageUrl(value: string) {
  try {
    const u = new URL(value);
    return /^https?:$/i.test(u.protocol) && /\\.(jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(u.pathname);
  } catch {
    return false;
  }
}
async function isFetchableImage(value: string): Promise<boolean> {
  try {
    const r = await fetch(value, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 Anjanay-Heights verified property publisher' } });
    const type = String(r.headers.get('content-type') || '').toLowerCase();
    if (r.ok && type.startsWith('image/')) return true;
  } catch {}
  return false;
}
const officialSourcePages: Record<string, string> = {
  'NorthWind Sanctuary': 'https://www.northwindestates.com/residential/northwind-sanctuary',
};
async function resolveImageFromSource(sourceUrl: string): Promise<string> {
  if (!sourceUrl || !/^https?:\\/\\//i.test(sourceUrl)) return '';
  if (isImageUrl(sourceUrl) && await isFetchableImage(sourceUrl)) return sourceUrl;
  try {
    const r = await fetch(sourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0 Anjanay-Heights verified property publisher' } });
    if (!r.ok) return '';
    const html = await r.text();
    const candidates: string[] = [];
    const metaRe = /<meta[^>]+(?:property|name)=[\"'](?:og:image|twitter:image|twitter:image:src)[\"'][^>]+content=[\"']([^\"']+)[\"'][^>]*>/gi;
    for (const m of html.matchAll(metaRe)) candidates.push(m[1]);
    const reverseMetaRe = /<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+(?:property|name)=[\"'](?:og:image|twitter:image|twitter:image:src)[\"'][^>]*>/gi;
    for (const m of html.matchAll(reverseMetaRe)) candidates.push(m[1]);
    const imgRe = /<img[^>]+(?:src|data-src|data-lazy-src)=[\"']([^\"']+)[\"'][^>]*>/gi;
    for (const m of html.matchAll(imgRe)) candidates.push(m[1]);
    for (const raw of candidates) {
      const u = absoluteUrl(raw, sourceUrl);
      if (isImageUrl(u) && await isFetchableImage(u)) return u;
    }
  } catch {}
  return '';
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
    'DM for availability & site visit.',
    `🔗 ${p.url}`,
  ].filter(Boolean).join('\\n');
}
async function getPageAccessToken(systemUserToken: string, pageId: string) {
  const r = await fetch(`${GRAPH_BASE}/me/accounts?fields=id,access_token&access_token=${encodeURIComponent(systemUserToken)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.error) throw new Error(data?.error?.message || `Facebook Page token lookup failed ${r.status}`);
  const page = Array.isArray(data?.data) ? data.data.find((item: any) => String(item?.id) === pageId) : null;
  if (!page?.access_token) throw new Error('Facebook Page access token could not be resolved for the assigned Page.');
  return String(page.access_token);
}
async function metaPost(path: string, body: Record<string,string>) {
  const r = await fetch(`${GRAPH_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.error) throw new Error(data?.error?.message || `Facebook API error ${r.status}`);
  return data;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' });

  const token = process.env.META_SYSTEM_USER_TOKEN || '';
  const pageId = process.env.META_PAGE_ID || '1297238420139113';
  if (!token) return json(res, 503, { ok: false, error: 'Facebook publishing is not configured.' });

  try {
    const inventoryUrl = 'https://anjanayheights-9m6i.vercel.app/api/inventory-public';
    const sr = await fetch(inventoryUrl, { headers: { 'Cache-Control': 'no-cache' } });
    if (!sr.ok) throw new Error(`Inventory unavailable (${sr.status})`);
    const inventory = await sr.json();
    const rows: any[] = Array.isArray(inventory?.properties) ? inventory.properties : [];
    const published = await loadPublished();
    const baseCandidates = rows.map(p => ({
      id: String(p.id),
      title: String(p.name || 'Property'),
      location: String(p.location || ''),
      propertyType: String(p.property_type || ''),
      price: String(p.price || ''),
      area: String(p.area || ''),
      bedrooms: String(p.configuration || ''),
      photo: '',
      url: `https://anjanayheights-9m6i.vercel.app/?property=${encodeURIComponent(String(p.id))}`,
      hotScore: Number(p.hot_score || 0),
      sourcePage: String(p.photos_url || p.source_url || officialSourcePages[String(p.name || p.title || '')] || '')
    })).filter(p => p.id && !published[p.id]);

    const candidates: any[] = [];
    for (const p of baseCandidates) {
      p.photo = await resolveImageFromSource(p.sourcePage);
      if (p.photo) candidates.push(p);
      if (candidates.length >= 5) break;
    }

    if (!candidates.length) return json(res, 200, {
      ok: true, posted: false,
      reason: 'No new verified public property with a valid image is ready for Facebook.',
      candidatesChecked: rows.length
    });

    const p = candidates[0];
    const pageAccessToken = await getPageAccessToken(token, pageId);
    const publishedPost = await metaPost(`${pageId}/photos`, {
      url: p.photo,
      caption: caption(p),
      published: 'true',
      access_token: pageAccessToken
    });

    published[p.id] = {
      postId: String(publishedPost.post_id || publishedPost.id || ''),
      postedAt: new Date().toISOString(),
      title: p.title
    };
    await savePublished(published);

    return json(res, 200, {
      ok: true, posted: true, propertyId: p.id, title: p.title,
      postId: String(publishedPost.post_id || publishedPost.id || '')
    });
  } catch (e: any) {
    console.error('facebook-auto-post error', e);
    return json(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
