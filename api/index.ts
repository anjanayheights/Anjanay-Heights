// Single Vercel entrypoint for the Hobby-plan function limit.
// Import server modules without explicit .ts extensions so Vercel bundles the
// TypeScript modules into the generated server function instead of leaving
// runtime references to source files that are not present in /var/task.
import * as m0 from '../server-api/ai-lead-assistant';
import * as m1 from '../server-api/assigned-lead-alert';
import * as m2 from '../server-api/booking-control';
import * as m3 from '../server-api/collection-priority';
import * as m4 from '../server-api/customer-ai';
import * as m5 from '../server-api/customer-whatsapp';
import * as m6 from '../server-api/follow-up-automation';
import * as m7 from '../server-api/follow-up-cron';
import * as m8 from '../server-api/follow-up-push';
import * as m9 from '../server-api/followup-engine';
import * as m10 from '../server-api/inventory-public';
import * as m11 from '../server-api/lead-assignment';
import * as m12 from '../server-api/lead-conversion-plan';
import * as m13 from '../server-api/lead-match';
import * as m14 from '../server-api/lead-meta';
import * as m15 from '../server-api/lead-property-match';
import * as m16 from '../server-api/lead-reengagement';
import * as m17 from '../server-api/lead-response-sla';
import * as m18 from '../server-api/lead-routing';
import * as m19 from '../server-api/lead-shortlist-send';
import * as m20 from '../server-api/leads';
import * as m21 from '../server-api/meta-lead-auto-route';
import * as m22 from '../server-api/meta-lead-webhook';
import * as m23 from '../server-api/payment-collections';
import * as m24 from '../server-api/payment-escalation-alert';
import * as m25 from '../server-api/payment-escalation';
import * as m26 from '../server-api/payment-ledger';
import * as m27 from '../server-api/payment-schedule';
import * as m28 from '../server-api/post-visit-followup';
import * as m29 from '../server-api/priority-match-queue';
import * as m30 from '../server-api/properties';
import * as m31 from '../server-api/property-history';
import * as m32 from '../server-api/property-match';
import * as m33 from '../server-api/push';
import * as m34 from '../server-api/referral-request';
import * as m35 from '../server-api/review-request';
import * as m36 from '../server-api/sales-priority-queue';
import * as m37 from '../server-api/site-visit-alert';
import * as m38 from '../server-api/site-visit-complete';
import * as m39 from '../server-api/site-visit-reminders';
import * as m40 from '../server-api/site-visit-request';
import * as m41 from '../server-api/visitor';
import * as m42 from '../server-api/whatsapp-webhook';

const routes: Record<string, any> = {
  'ai-lead-assistant': m0,
  'assigned-lead-alert': m1,
  'booking-control': m2,
  'collection-priority': m3,
  'customer-ai': m4,
  'customer-whatsapp': m5,
  'follow-up-automation': m6,
  'follow-up-cron': m7,
  'follow-up-push': m8,
  'followup-engine': m9,
  'inventory-public': m10,
  'lead-assignment': m11,
  'lead-conversion-plan': m12,
  'lead-match': m13,
  'lead-meta': m14,
  'lead-property-match': m15,
  'lead-reengagement': m16,
  'lead-response-sla': m17,
  'lead-routing': m18,
  'lead-shortlist-send': m19,
  'leads': m20,
  'meta-lead-auto-route': m21,
  'meta-lead-webhook': m22,
  'payment-collections': m23,
  'payment-escalation-alert': m24,
  'payment-escalation': m25,
  'payment-ledger': m26,
  'payment-schedule': m27,
  'post-visit-followup': m28,
  'priority-match-queue': m29,
  'properties': m30,
  'property-history': m31,
  'property-match': m32,
  'push': m33,
  'referral-request': m34,
  'review-request': m35,
  'sales-priority-queue': m36,
  'site-visit-alert': m37,
  'site-visit-complete': m38,
  'site-visit-reminders': m39,
  'site-visit-request': m40,
  'visitor': m41,
  'whatsapp-webhook': m42,
};

function routeFromRequest(req: any) {
  const explicit = req?.query?.route;
  if (explicit) return String(explicit).replace(/^\/+|\/+$/g, '');
  const raw = String(req?.url || '').split('?')[0];
  return raw.replace(/^\/api\/+/, '').replace(/\/+$/, '');
}

export default async function handler(req: any, res: any) {
  const route = routeFromRequest(req);
  const mod = routes[route];
  const fn = mod?.default || mod?.handler;
  if (typeof fn !== 'function') {
    return res.status(404).json({ error: 'API route not found.', route });
  }
  return fn(req, res);
}
