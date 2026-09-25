const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';
const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`;
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
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || '';

async function supabaseRequest(path: string, init: RequestInit = {}) {
  if (!SUPABASE_KEY) throw new Error('Supabase server key is not configured.');
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      ...(SUPABASE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SUPABASE_KEY } : {}),
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error('Supabase request failed (' + r.status + '): ' + (await r.text()).slice(0,300));
  return r;
}
async function loadPublished(): Promise<Record<string, any>> {
  const r = await supabaseRequest('social_posts?platform=eq.instagram&select=property_id,post_id,posted_at,title');
  const rows = await r.json();
  return Object.fromEntries((Array.isArray(rows) ? rows : []).map((x:any) => [String(x.property_id), x]));
}
async function savePublished(propertyId: string, postId: string, title: string) {
  await supabaseRequest('social_posts?on_conflict=platform,property_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ platform:'instagram', property_id:propertyId, post_id:postId, title, posted_at:new Date().toISOString() })
  });
}
function caption(p: any) {
  const hashtags = '#AnjanayHeights #Noida #GreaterNoida #DelhiNCR #RealEstate #PropertyForSale #PropertyInvestment #VerifiedProperty #NoidaRealEstate #GreaterNoidaRealEstate #CommercialProperty #ResidentialProperty #SiteVisit';
  return [
    `🔥 ${p.title}`, `📍 ${p.location}`,
    p.propertyType ? `🏠 ${p.propertyType}` : '',
    p.bedrooms ? `🛏️ ${p.bedrooms}` : '',
    p.area ? `📐 ${p.area}` : '',
    p.price ? `💰 ${p.price}` : '', '',
    'Verified Anjanay Heights inventory.',
    'WhatsApp / Call: +91 92897 71222',
    'DM for availability & site visit.', '', hashtags
  ].filter(Boolean).join('\\n');
}
async function waitForContainer(id: string, token: string) {\n  const deadline = Date.now() + 25000;\n  while (Date.now() < deadline) {\n    const r = await fetch(`${GRAPH_BASE}/${id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);\n    const raw = await r.text();\n    let data:any = {};\n    try { data = raw ? JSON.parse(raw) : {}; } catch {}\n    if (data?.error) throw new Error(`Meta container status: ${data.error.message || raw.slice(0,300)}`);\n    const status = String(data?.status_code || data?.status || "").toUpperCase();\n    if (status === "FINISHED") return;\n    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Meta media container ${status}: ${raw.slice(0,500)}`);\n    await new Promise(r => setTimeout(r, 1500));\n  }\n  throw new Error("Meta media container did not finish processing within 25 seconds.");\n}\n\nasync function metaPost(path: string, body: Record<string,string>) {
  const url = `${GRAPH_BASE}/${path}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body)
  });
  const raw = await r.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch {}
  if (!r.ok || data?.error) {
    const e = data?.error;
    const detail = e
      ? `${e.message || "Instagram API error"}${e.type ? ` [${e.type}]` : ""}${e.code != null ? ` code=${e.code}` : ""}${e.error_subcode != null ? ` subcode=${e.error_subcode}` : ""}`
      : `Instagram API error ${r.status}: ${raw.slice(0,500)}`;
    throw new Error(`Meta ${path}: ${detail}`);
  }
  if (!data?.id) throw new Error(`Meta ${path}: response did not contain an id. HTTP ${r.status}; response=${raw.slice(0,500)}`);
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
      photo: (() => { const raw = typeof p.photos_url === 'string' ? p.photos_url : (Array.isArray(p.photos) ? p.photos[0] : ''); const url = String(raw || '').trim(); return /\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(url) ? url : ''; })(),
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
    await savePublished(p.id, String(publishedMedia.id || created.id), p.title);

    return json(res, 200, {
      ok: true, posted: true, propertyId: p.id, title: p.title,
      mediaId: String(publishedMedia.id || created.id)
    });
  } catch (e: any) {
    console.error('instagram-auto-post error', e);
    return json(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
