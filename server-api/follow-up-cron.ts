import { get, list, put } from '@vercel/blob';
import { notifyFollowUpReminder } from './follow-up-push';

const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];

function getHeader(request: any, name: string) { const headers = request?.headers; if (headers && typeof headers.get === 'function') return headers.get(name) || ''; const value = headers?.[name.toLowerCase()] ?? headers?.[name]; return Array.isArray(value) ? value[0] || '' : value || ''; }
function send(response: any, status: number, body: unknown) { return response.status(status).setHeader('Cache-Control', 'no-store, no-cache, must-revalidate').json(body); }
function authorized(request: any) { const secret = process.env.CRON_SECRET || ''; if (!secret) return true; return getHeader(request, 'authorization') === `Bearer ${secret}`; }
function isBlobAuthError(error: unknown) { const value = error as any; return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${String(value?.name ?? '')} ${String(value?.message ?? '')}`); }
async function withBlobAuth<T>(operation: (auth: Record<string, string>) => Promise<T>) { let lastError: unknown = new Error('No Vercel Blob credentials configured.'); for (const auth of [{}, ...blobAuthCandidates] as Record<string, string>[]) { try { return await operation(auth); } catch (error) { lastError = error; if (!isBlobAuthError(error)) throw error; } } throw lastError; }
async function readBlobJson(url: string) { const result = await withBlobAuth((auth) => get(url, { access: 'private', useCache: false, ...auth })); if (!result || result.statusCode !== 200 || !result.stream) return null; return await new Response(result.stream).json(); }
async function loadLeads() { const result = await withBlobAuth((auth) => list({ prefix: 'leads/', ...auth })); const values = await Promise.all(result.blobs.map(async (blob) => { try { return await readBlobJson(blob.url); } catch { return null; } })); return values.filter(Boolean); }
async function loadMeta() { const result = await withBlobAuth((auth) => list({ prefix: 'crm/lead-meta.json', ...auth })); const blob = result.blobs[0]; if (!blob) return {}; try { return (await readBlobJson(blob.url)) || {}; } catch { return {}; } }
function istDate(offsetDays = 0) { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const y = Number(parts.find(p => p.type === 'year')?.value); const m = Number(parts.find(p => p.type === 'month')?.value) - 1; const d = Number(parts.find(p => p.type === 'day')?.value); return new Date(Date.UTC(y, m, d + offsetDays)).toISOString().slice(0, 10); }
function scoreLead(lead: any, itemMeta: any) { let score = 0; const text = [lead.property_type, lead.location, lead.budget, lead.timeline, lead.requirement, lead.message, itemMeta.location, itemMeta.budget, itemMeta.timeline].join(' ').toLowerCase(); if (lead.phone) score += 10; if (lead.email) score += 5; if (/site visit|visit|immediate|urgent|today|asap|this week|within 7 days|within 1 week/.test(text)) score += 25; if (/ready|cash|loan approved|approval/.test(text)) score += 20; if (lead.budget || itemMeta.budget) score += 15; if (lead.location || itemMeta.location) score += 10; if (lead.property_type || itemMeta.propertyType) score += 10; if (itemMeta.status === 'Site Visit') score += 5; if (itemMeta.status === 'Negotiation') score += 10; return Math.min(100, score); }
function priority(score: number) { return score >= 75 ? 'Very Hot' : score >= 55 ? 'Hot' : score >= 30 ? 'Warm' : 'Cold'; }
function isDue(value: unknown, today: string) { const d = String(value || '').slice(0, 10); return Boolean(d && d <= today); }
function isSameDay(value: unknown, date: string) { return String(value || '').slice(0, 10) === date; }

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') return send(response, 405, { error: 'Method not allowed' });
  if (!authorized(request)) return send(response, 401, { error: 'Unauthorized' });
  try {
    const today = istDate();
    const tomorrow = istDate(1);
    const [leads, meta] = await Promise.all([loadLeads(), loadMeta()]);
    const active = leads.map((lead: any) => ({ lead, meta: meta?.[lead.id] || {} })).filter(({ meta: itemMeta }: any) => itemMeta.status !== 'Closed' && itemMeta.status !== 'Lost');
    const due = active.filter(({ meta: itemMeta }: any) => isDue(itemMeta.followUp, today));
    const overdue = active.filter(({ meta: itemMeta }: any) => String(itemMeta.followUp || '').slice(0, 10) < today);
    const todayQueue = active.filter(({ meta: itemMeta }: any) => isSameDay(itemMeta.followUp, today));
    const siteVisitReminders = active.filter(({ meta: itemMeta }: any) => itemMeta.status === 'Site Visit' && (isSameDay(itemMeta.followUp, today) || isSameDay(itemMeta.followUp, tomorrow)));

    let backfilled = 0;
    const changedMeta = { ...meta };
    for (const { lead, meta: itemMeta } of active as any[]) {
      const score = scoreLead(lead, itemMeta);
      const nextPriority = priority(score);
      const missingFollowUp = !String(itemMeta.followUp || '').trim();
      const missingNextAction = !String(itemMeta.nextAction || '').trim();
      const missingPriority = !String(itemMeta.priority || '').trim();
      if (!missingFollowUp && !missingNextAction && !missingPriority) continue;
      const followUp = missingFollowUp ? `${istDate(score >= 75 ? 0 : 1)}T${score >= 75 ? '16:00' : '10:00'}` : itemMeta.followUp;
      changedMeta[lead.id] = { ...itemMeta, status: itemMeta.status || 'New', priority: itemMeta.priority || nextPriority, nextAction: itemMeta.nextAction || 'Call', followUp, propertyType: itemMeta.propertyType || lead.property_type || '', location: itemMeta.location || lead.location || '', budget: itemMeta.budget || lead.budget || '', timeline: itemMeta.timeline || lead.timeline || '', history: itemMeta.history || [] };
      backfilled += 1;
    }
    if (backfilled) await withBlobAuth((auth) => put('crm/lead-meta.json', JSON.stringify(changedMeta), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', ...auth }));

    const overdueIds = new Set(overdue.map(({ lead }: any) => lead.id));
    const notificationItems = [
      ...overdue.map(({ lead, meta: itemMeta }: any) => ({ id: lead.id, name: lead.name, phone: lead.phone, priority: itemMeta.priority || priority(scoreLead(lead, itemMeta)), nextAction: itemMeta.nextAction || 'Call', followUp: itemMeta.followUp, overdue: true })),
      ...todayQueue.filter(({ lead }: any) => !overdueIds.has(lead.id)).map(({ lead, meta: itemMeta }: any) => ({ id: lead.id, name: lead.name, phone: lead.phone, priority: itemMeta.priority || priority(scoreLead(lead, itemMeta)), nextAction: itemMeta.nextAction || 'Call', followUp: itemMeta.followUp })),
      ...siteVisitReminders.filter(({ lead }: any) => !overdueIds.has(lead.id)).map(({ lead, meta: itemMeta }: any) => ({ id: lead.id, name: lead.name, phone: lead.phone, priority: itemMeta.priority || priority(scoreLead(lead, itemMeta)), nextAction: itemMeta.nextAction || 'Confirm Site Visit', followUp: itemMeta.followUp, siteVisit: true })),
    ];
    const notificationResults = await Promise.all(notificationItems.map((item: any) => notifyFollowUpReminder(item).catch((error) => { console.error('follow-up notification error', error); return { sent: 0, configured: false }; })));
    const notificationsSent = notificationResults.reduce((sum: number, item: any) => sum + Number(item?.sent || 0), 0);

    const secretConfigured = Boolean(process.env.CRON_SECRET);
    return send(response, 200, { ok: true, scheduler: 'crm-automation', date: today, dueCount: due.length, overdueCount: overdue.length, todayCount: todayQueue.length, siteVisitReminderCount: siteVisitReminders.length, totalLeads: leads.length, activeLeads: active.length, backfilled, notificationsSent, generatedAt: new Date().toISOString(), ...(secretConfigured ? { due: due.map(({ lead, meta: itemMeta }: any) => ({ id: lead.id, name: lead.name || '', phone: lead.phone || '', source: lead.source || '', priority: itemMeta.priority || priority(scoreLead(lead, itemMeta)), nextAction: itemMeta.nextAction || 'Call', followUp: itemMeta.followUp || '', note: itemMeta.note || '' })), overdue: overdue.map(({ lead, meta: itemMeta }: any) => ({ id: lead.id, name: lead.name || '', phone: lead.phone || '', priority: itemMeta.priority || priority(scoreLead(lead, itemMeta)), nextAction: itemMeta.nextAction || 'Call', followUp: itemMeta.followUp || '' })), siteVisitReminders: siteVisitReminders.map(({ lead, meta: itemMeta }: any) => ({ id: lead.id, name: lead.name || '', phone: lead.phone || '', followUp: itemMeta.followUp || '', nextAction: itemMeta.nextAction || 'Confirm Site Visit' })) } : {}) });
  } catch (error) { console.error('follow-up-cron error', error); return send(response, 500, { error: 'Unable to generate the CRM automation queue.' }); }
}
