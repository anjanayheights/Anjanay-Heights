import { get, head, list } from '@vercel/blob';
import { createHmac } from 'node:crypto';

const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];

function send(res: any, status: number, body: unknown) { return res.status(status).setHeader('Cache-Control', 'no-store').json(body); }
function header(req: any, name: string) { const h = req?.headers; return h && typeof h.get === 'function' ? h.get(name) || '' : h?.[name.toLowerCase()] || h?.[name] || ''; }
function authorized(req: any) { const password = process.env.DASHBOARD_PASSWORD || ''; const bearer = header(req, 'authorization'); return Boolean(password && bearer === `Bearer ${password}`); }
function isBlobAuthError(error: unknown) { const v = error as any; return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${v?.name || ''} ${v?.message || ''}`); }
async function withBlobAuth<T>(op: (auth: Record<string, string>) => Promise<T>) { let last: unknown = new Error('Blob credentials not configured.'); for (const auth of ([{}, ...blobAuthCandidates] as Record<string, string>[])) { try { return await op(auth); } catch (e) { last = e; if (!isBlobAuthError(e)) throw e; } } throw last; }
async function read(url: string) { const r = await withBlobAuth((auth) => get(url, { access: 'private', ...auth })); return r?.statusCode === 200 && r.stream ? await new Response(r.stream).json() : null; }
async function readCollection(path: string) { try { const info: any = await withBlobAuth((auth) => head(path, auth)); return info?.url ? await read(info.url) : null; } catch { return null; } }

function intent(lead: any) {
  const text = [lead.lead_type, lead.requirement, lead.message, lead.next_step, lead.property_type].join(' ').toLowerCase();
  if (/sell|selling|seller|resale/.test(text)) return 'SELL';
  if (/invest|investment|roi|return/.test(text)) return 'INVEST';
  return 'BUY';
}
function urgency(lead: any, meta: any) {
  const text = [lead.timeline, lead.requirement, lead.message, lead.next_step, meta?.nextAction, meta?.recommendedAction].join(' ').toLowerCase();
  if (/today|immediate|urgent|asap|15 minutes|site visit|visit|booking|token|advance/.test(text)) return 3;
  if (/this week|within 7 days|within 1 week|ready|shortlist|serious/.test(text)) return 2;
  return 1;
}
function priorityRank(value: string) { return value === 'Very Hot' ? 4 : value === 'Hot' ? 3 : value === 'Warm' ? 2 : 1; }
function routeReason(lead: any, meta: any) {
  const p = meta?.priority || 'Cold';
  const i = intent(lead);
  if (meta?.salesStage === 'SITE VISIT SCHEDULED' || /site visit|visit/i.test([lead.next_step, lead.requirement].join(' '))) return 'Site visit lead — confirm appointment first';
  if (p === 'Very Hot') return `${i} lead with immediate buying intent`;
  if (p === 'Hot') return `${i} lead — contact today and send matched options`;
  if (p === 'Warm') return `${i} lead — qualify budget, location and timeline`;
  return `${i} lead — first contact and requirement capture`;
}
function todayIST() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function minutesFromNow(iso: string) { const t = Date.parse(iso); return Number.isFinite(t) ? Math.round((t - Date.now()) / 60000) : 999999; }

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return send(res, 401, { error: 'Unauthorized' });
  try {
    const result: any = await withBlobAuth((auth) => list({ prefix: 'leads/', ...auth }));
    const leads = (await Promise.all(result.blobs.map(async (b: any) => { try { return await read(b.url); } catch { return null; } }))).filter(Boolean);
    const meta = (await readCollection('crm/lead-meta.json')) || {};
    const routed = leads.map((lead: any) => {
      const m = meta[lead.id] || {};
      const priority = m.priority || 'Cold';
      const followUp = m.followUp || '';
      const due = followUp ? minutesFromNow(followUp) <= 0 : false;
      const intentValue = intent(lead);
      const urgencyValue = urgency(lead, m);
      const score = Number(m.score ?? lead.score ?? 0) || 0;
      return { ...lead, priority, score, salesStage: m.salesStage || 'NEW LEAD', nextAction: m.nextAction || 'Call', recommendedAction: m.recommendedAction || 'Start first contact and capture requirement', followUp, intent: intentValue, urgency: urgencyValue, due, routeReason: routeReason(lead, m) };
    });
    const queue = routed.sort((a: any, b: any) => {
      if (Number(b.due) !== Number(a.due)) return Number(b.due) - Number(a.due);
      if (priorityRank(b.priority) !== priorityRank(a.priority)) return priorityRank(b.priority) - priorityRank(a.priority);
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      return Date.parse(a.created_at || '') - Date.parse(b.created_at || '');
    });
    const today = todayIST();
    const dueToday = queue.filter((l: any) => l.due || String(l.followUp).startsWith(today));
    return send(res, 200, {
      ok: true,
      generatedAt: new Date().toISOString(),
      summary: { total: routed.length, veryHot: routed.filter((l: any) => l.priority === 'Very Hot').length, hot: routed.filter((l: any) => l.priority === 'Hot').length, warm: routed.filter((l: any) => l.priority === 'Warm').length, dueToday: dueToday.length, buy: routed.filter((l: any) => l.intent === 'BUY').length, sell: routed.filter((l: any) => l.intent === 'SELL').length, invest: routed.filter((l: any) => l.intent === 'INVEST').length },
      queue: queue.slice(0, 50),
      dueToday: dueToday.slice(0, 25),
    });
  } catch (e) { console.error('lead routing error', e); return send(res, 500, { error: 'Unable to build lead routing queue.' }); }
}
