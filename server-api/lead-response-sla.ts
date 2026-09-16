import { get, list, put } from '@vercel/blob';
import { notifyFollowUpReminder } from './follow-up-push.js';

const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];

function header(req: any, name: string) { const h = req?.headers; if (h && typeof h.get === 'function') return h.get(name) || ''; return h?.[name.toLowerCase()] || h?.[name] || ''; }
function send(res: any, status: number, body: unknown) { return res.status(status).setHeader('Cache-Control', 'no-store').json(body); }
function authorized(req: any) { const secret = process.env.CRON_SECRET || ''; return !secret || header(req, 'authorization') === `Bearer ${secret}`; }
function isBlobAuthError(error: unknown) { const value = error as any; return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${String(value?.name ?? '')} ${String(value?.message ?? '')}`); }
async function withBlobAuth<T>(operation: (auth: Record<string, string>) => Promise<T>) { let lastError: unknown = new Error('No Vercel Blob credentials configured.'); for (const auth of [{}, ...blobAuthCandidates] as Record<string, string>[]) { try { return await operation(auth); } catch (error) { lastError = error; if (!isBlobAuthError(error)) throw error; } } throw lastError; }
async function read(url: string) { const r = await withBlobAuth((auth) => get(url, { access: 'private', useCache: false, ...auth })); return r?.statusCode === 200 && r.stream ? await new Response(r.stream).json() : null; }
async function loadLeads() { const result = await withBlobAuth((auth) => list({ prefix: 'leads/', ...auth })); return (await Promise.all(result.blobs.map(async (b) => { try { return await read(b.url); } catch { return null; } }))).filter(Boolean); }
async function loadMeta() { const result = await withBlobAuth((auth) => list({ prefix: 'crm/lead-meta.json', ...auth })); const blob = result.blobs[0]; return blob ? ((await read(blob.url)) || {}) : {}; }
function ageMinutes(createdAt: string) { return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000); }

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return send(res, 401, { error: 'Unauthorized' });
  try {
    const [leads, meta] = await Promise.all([loadLeads(), loadMeta()]);
    const changed = { ...meta };
    const now = Date.now();
    const candidates = leads.filter((lead: any) => {
      const item = meta?.[lead.id] || {};
      if (item.status === 'Closed' || item.status === 'Lost') return false;
      if (Array.isArray(item.callHistory) && item.callHistory.length) return false;
      const age = ageMinutes(String(lead.created_at || ''));
      if (!Number.isFinite(age) || age < 15) return false;
      const alerted = new Date(String(item.slaAlertedAt || '')).getTime();
      return !Number.isFinite(alerted) || now - alerted > 12 * 60 * 60 * 1000;
    });
    const results = await Promise.all(candidates.map(async (lead: any) => {
      const item = meta?.[lead.id] || {};
      const result = await notifyFollowUpReminder({ id: lead.id, name: lead.name, phone: lead.phone, priority: item.priority || 'Hot', nextAction: 'CALL NOW — response SLA breached', followUp: lead.created_at, reminderType: 'LEAD-SLA' }).catch(() => ({ sent: 0, configured: false }));
      changed[lead.id] = { ...item, slaAlertedAt: new Date().toISOString(), history: [...(Array.isArray(item.history) ? item.history : []), { id: `sla-${Date.now()}-${lead.id}`, at: new Date().toISOString(), action: 'Response SLA', note: 'New lead has not been contacted within 15 minutes.' }] };
      return result;
    }));
    if (candidates.length) await withBlobAuth((auth) => put('crm/lead-meta.json', JSON.stringify(changed), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', ...auth }));
    return send(res, 200, { ok: true, checked: leads.length, slaBreaches: candidates.length, notificationsSent: results.reduce((sum: number, r: any) => sum + Number(r?.sent || 0), 0), generatedAt: new Date().toISOString() });
  } catch (error) { console.error('lead-response-sla error', error); return send(res, 500, { error: 'Unable to process lead response SLA.' }); }
}
