import webpush from 'web-push';
import { get, list, put } from '@vercel/blob';

const BLOB_PATH = 'crm/push-subscriptions.json';
const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];
function isBlobAuthError(error: unknown) { const value = error as any; return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${String(value?.name ?? value?.constructor?.name ?? '')} ${String(value?.message ?? '')}`); }
async function withBlobAuth<T>(operation: (auth: Record<string, string>) => Promise<T>) { let lastError: unknown = new Error('No Vercel Blob credentials configured.'); for (const auth of [{}, ...blobAuthCandidates] as Record<string, string>[]) { try { return await operation(auth); } catch (error) { lastError = error; if (!isBlobAuthError(error)) throw error; } } throw lastError; }
async function read(url: string) { const r = await withBlobAuth((auth) => get(url, { access: 'private', useCache: false, ...auth })); return r?.statusCode === 200 && r.stream ? await new Response(r.stream).json() : null; }
async function loadSubscriptions(): Promise<webpush.PushSubscription[]> { const result = await withBlobAuth((auth) => list({ prefix: BLOB_PATH, ...auth })); if (!result.blobs.length) return []; const data = await read(result.blobs[0].url); return Array.isArray(data) ? data : []; }
export async function notifyFollowUpReminder(item: { id: string; name?: string; phone?: string; priority?: string; nextAction?: string; followUp?: string; overdue?: boolean; siteVisit?: boolean; reminderType?: string }) {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  if (!publicKey || !privateKey) return { sent: 0, configured: false };
  const subscriptions = await loadSubscriptions();
  if (!subscriptions.length) return { sent: 0, configured: true };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:sales@anjanayheights.com', publicKey, privateKey);
  const reminderType = item.reminderType || (item.overdue ? 'OVERDUE' : item.siteVisit ? 'SITE VISIT REMINDER' : 'FOLLOW-UP DUE');
  const title = reminderType === 'T-24H' ? '📅 Site Visit — 24 Hour Reminder' : reminderType === 'T-2H' ? '⏰ Site Visit — 2 Hour Reminder' : reminderType === 'MISSED' ? '⚠️ Site Visit Missed' : item.overdue ? '⚠️ CRM Follow-up Overdue' : item.siteVisit ? '📅 Site Visit Reminder' : '⏰ CRM Follow-up Due';
  const body = `${item.name || 'Lead'}${item.phone ? ` • ${item.phone}` : ''}\n${item.nextAction || 'Call'}${item.followUp ? ` • ${item.followUp}` : ''}${item.priority ? `\nPriority: ${item.priority}` : ''}`;
  let sent = 0; const stale = new Set<string>();
  await Promise.all(subscriptions.map(async (subscription) => { try { await webpush.sendNotification(subscription, JSON.stringify({ title, body, tag: `follow-up-${item.id}-${reminderType}-${String(item.followUp || '').slice(0, 10)}`, url: `/admin/sales-engine?lead=${encodeURIComponent(item.id)}` })); sent += 1; } catch (error: any) { if (error?.statusCode === 404 || error?.statusCode === 410) stale.add(subscription.endpoint); else console.error('follow-up push error', error); } }));
  if (stale.size) { try { await withBlobAuth((auth) => put(BLOB_PATH, JSON.stringify(subscriptions.filter((s) => !stale.has(s.endpoint))), { access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true, ...auth })); } catch (error) { console.error('follow-up stale cleanup error', error); } }
  return { sent, configured: true };
}
