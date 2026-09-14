import { get, list } from '@vercel/blob';

const authCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];

function send(res: any, status: number, body: unknown) { return res.status(status).setHeader('Cache-Control', 'no-store').json(body); }
async function withAuth<T>(fn: (auth: Record<string,string>) => Promise<T>) {
  let last: unknown = new Error('Inventory storage is not configured.');
  for (const auth of [{}, ...authCandidates] as Record<string,string>[]) {
    try { return await fn(auth); } catch (e) { last = e; }
  }
  throw last;
}
async function read(url: string) {
  const r = await withAuth((auth) => get(url, { access: 'private', ...auth }));
  return r?.statusCode === 200 && r.stream ? await new Response(r.stream).json() : null;
}
function money(v: unknown) {
  const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function matches(p: any, q: any) {
  const text = `${p.title||''} ${p.location||''} ${p.propertyType||p.type||''} ${p.bedrooms||''}`.toLowerCase();
  if (q.location && !text.includes(String(q.location).toLowerCase())) return false;
  if (q.type && !text.includes(String(q.type).toLowerCase())) return false;
  if (q.bhk) {
    const wanted = String(q.bhk).match(/\d+/)?.[0];
    const nums = String(p.bedrooms||'').match(/\d+(?:\.\d+)?/g) || [];
    if (wanted && !nums.includes(wanted)) return false;
  }
  const budget = money(q.budget);
  if (budget) {
    const min = money(p.minBudget || p.minPrice || p.price);
    const max = money(p.maxBudget || p.maxPrice || p.price);
    if (min && min > budget) return false;
    if (max && max < budget * 0.75) return false;
  }
  return true;
}
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const q = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const result = await withAuth((auth) => list({ prefix: 'crm/properties/', ...auth }));
    const rows = (await Promise.all(result.blobs.map(async (b) => { try { return await read(b.url); } catch { return null; } }))).filter(Boolean).filter((p: any) => String(p.status || 'Available').toLowerCase() === 'available');
    const matchesList = rows.filter((p: any) => matches(p, q)).slice(0, 5).map((p: any, i: number) => ({
      id: p.id, title: p.title, location: p.location, propertyType: p.propertyType || p.type, price: p.price, area: p.area, bedrooms: p.bedrooms, photos: p.photos || [], videoUrl: p.videoUrl || '', rank: i + 1,
    }));
    return send(res, 200, { ok: true, count: matchesList.length, properties: matchesList });
  } catch (e) {
    console.error('property match error', e);
    return send(res, 500, { error: 'Unable to match properties right now.' });
  }
}
