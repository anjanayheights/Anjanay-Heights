// Single Vercel entrypoint for the Hobby-plan function limit.
// All existing API modules are preserved under /server-api and dispatched here.
import * as m0 from '../server-api/ai-lead-assistant.ts';
import * as m1 from '../server-api/assigned-lead-alert.ts';
import * as m2 from '../server-api/booking-control.ts';
import * as m3 from '../server-api/collection-priority.ts';
import * as m4 from '../server-api/customer-ai.ts';
import * as m5 from '../server-api/customer-whatsapp.ts';
import * as m6 from '../server-api/follow-up-automation.ts';
import * as m7 from '../server-api/follow-up-cron.ts';
import * as m8 from '../server-api/follow-up-push.ts';
import * as m9 from '../server-api/followup-engine.ts';
import * as m10 from '../server-api/inventory-public.ts';
import * as m11 from '../server-api/lead-assignment.ts';
import * as m12 from '../server-api/lead-conversion-plan.ts';
import * as m13 from '../server-api/lead-match.ts';
import * as m14 from '../server-api/lead-meta.ts';
import * as m15 from '../server-api/lead-property-match.ts';
import * as m16 from '../server-api/lead-reengagement.ts';
import * as m17 from '../server-api/lead-response-sla.ts';
import * as m18 from '../server-api/lead-routing.ts';
import * as m19 from '../server-api/lead-shortlist-send.ts';
import * as m20 from '../server-api/leads.ts';
import * as m21 from '../server-api/meta-lead-auto-route.ts';
import * as m22 from '../server-api/meta-lead-webhook.ts';
import * as m23 from '../server-api/payment-collections.ts';
import * as m24 from '../server-api/payment-escalation-alert.ts';
import * as m25 from '../server-api/payment-escalation.ts';
import * as m26 from '../server-api/payment-ledger.ts';
import * as m27 from '../server-api/payment-schedule.ts';
import * as m28 from '../server-api/post-visit-followup.ts';
import * as m29 from '../server-api/priority-match-queue.ts';
import * as m30 from '../server-api/properties.ts';
import * as m31 from '../server-api/property-history.ts';
import * as m32 from '../server-api/property-match.ts';
import * as m33 from '../server-api/push.ts';
import * as m34 from '../server-api/referral-request.ts';
import * as m35 from '../server-api/review-request.ts';
import * as m36 from '../server-api/sales-priority-queue.ts';
import * as m37 from '../server-api/site-visit-alert.ts';
import * as m38 from '../server-api/site-visit-complete.ts';
import * as m39 from '../server-api/site-visit-reminders.ts';
import * as m40 from '../server-api/site-visit-request.ts';
import * as m41 from '../server-api/visitor.ts';
import * as m42 from '../server-api/whatsapp-webhook.ts';

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
