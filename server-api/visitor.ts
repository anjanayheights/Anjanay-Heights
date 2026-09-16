import { list, put } from '@vercel/blob';

const PREFIX = 'analytics/visitors/';
const ACTIVE_WINDOW_MS = 90_000;

function send(response: any, status: number, body: unknown) {
  return response.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

function cookieValue(request: any, name: string) {
  const raw = String(request?.headers?.cookie || '');
  const match = raw.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

async function listVisitors() {
  const visitors: Array<{ uploadedAt?: string }> = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor });
    visitors.push(...(page.blobs || []).map((blob: any) => ({ uploadedAt: blob.uploadedAt })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return visitors;
}

export default async function handler(request: any, response: any) {
  try {
    if (request.method === 'GET') {
      const visitors = await listVisitors();
      const now = Date.now();
      const activeVisitors = visitors.filter((visitor) => {
        const lastSeen = Date.parse(String(visitor.uploadedAt || ''));
        return Number.isFinite(lastSeen) && now - lastSeen <= ACTIVE_WINDOW_MS;
      }).length;
      return send(response, 200, { totalViewers: visitors.length, activeVisitors });
    }

    if (request.method === 'POST') {
      let visitorId = cookieValue(request, 'ah_visitor');
      let isNew = false;

      if (!visitorId) {
        visitorId = crypto.randomUUID();
        isNew = true;
      }

      const blobName = `${PREFIX}${visitorId}.json`;
      await put(blobName, JSON.stringify({ id: visitorId, lastSeen: new Date().toISOString() }), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });

      if (isNew) {
        response.setHeader('Set-Cookie', `ah_visitor=${encodeURIComponent(visitorId)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
      }

      return send(response, 200, { ok: true, counted: isNew });
    }

    return send(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('visitor analytics error', error);
    return send(response, 500, { error: 'Unable to update visitor analytics.' });
  }
}
