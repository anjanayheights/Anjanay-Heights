import { get, list, put } from '@vercel/blob';

const blobAuth = { oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID };
const CURRENT = 'crm/properties.json';

function header(request: any, name: string) {
  const headers = request?.headers;
  if (headers && typeof headers.get === 'function') return headers.get(name) || '';
  return headers?.[name.toLowerCase()] || headers?.[name] || '';
}
function auth(request: any) { const expected = process.env.DASHBOARD_PASSWORD || ''; return Boolean(expected && header(request, 'authorization') === `Bearer ${expected}`); }
function send(response: any, status: number, body: unknown) { return response.status(status).setHeader('Cache-Control', 'no-store').json(body); }
async function readJson(url: string) { const r = await get(url, { access: 'private', ...blobAuth }); if (!r || r.statusCode !== 200 || !r.stream) return null; return await new Response(r.stream).json(); }

async function listAll(prefix: string) {
  const blobs: any[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const result = await list({ prefix, ...(cursor ? { cursor } : {}), ...blobAuth });
    blobs.push(...result.blobs);
    if (!result.hasMore || !result.cursor) break;
    cursor = result.cursor;
  }
  return blobs;
}

export default async function handler(request: any, response: any) {
  if (!auth(request)) return send(response, 401, { error: 'Unauthorized' });
  try {
    if (request.method === 'GET') {
      const blobs = await listAll('crm/');
      const snapshots = [];
      const storage = [];
      for (const blob of blobs) {
        if (!String(blob.pathname).includes('properties')) continue;
        let count: number | null = null;
        let titles: string[] = [];
        try {
          const data = await readJson(blob.url);
          if (Array.isArray(data)) { count = data.length; titles = data.map((p: any) => String(p?.title || '')).filter(Boolean).slice(0, 30); }
          if (String(blob.pathname).startsWith('crm/history/properties-') && Array.isArray(data)) {
            snapshots.push({ pathname: blob.pathname, uploadedAt: blob.uploadedAt, properties: data });
          }
        } catch { /* metadata remains useful even if content cannot be read */ }
        storage.push({ pathname: blob.pathname, uploadedAt: blob.uploadedAt, size: blob.size ?? null, count, titles });
      }
      snapshots.sort((a, b) => new Date(String(b.uploadedAt)).getTime() - new Date(String(a.uploadedAt)).getTime());
      storage.sort((a, b) => new Date(String(b.uploadedAt)).getTime() - new Date(String(a.uploadedAt)).getTime());
      return send(response, 200, { snapshots, storage });
    }
    if (request.method === 'POST') {
      const body = request.body && typeof request.body === 'object' ? request.body : JSON.parse(String(request.body || '{}'));
      if (body.action !== 'restore' || !Array.isArray(body.properties)) return send(response, 400, { error: 'Invalid restore request.' });
      const currentBlobs = await listAll(CURRENT);
      const current = await readJson(currentBlobs[0]?.url || CURRENT);
      if (!Array.isArray(current)) return send(response, 500, { error: 'Current inventory could not be read.' });
      await put(`crm/history/properties-before-restore-${Date.now()}.json`, JSON.stringify(current), { access: 'private', addRandomSuffix: true, contentType: 'application/json', ...blobAuth });
      await put(CURRENT, JSON.stringify(body.properties), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', ...blobAuth });
      return send(response, 200, { ok: true, properties: body.properties });
    }
    return send(response, 405, { error: 'Method not allowed' });
  } catch (error) { console.error('property history error', error); return send(response, 500, { error: 'Unable to access property history.' }); }
}
