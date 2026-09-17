// Single Vercel entrypoint for the Hobby-plan function limit.
// Inventory is statically bundled because it is a public, customer-facing route.
// Other sales modules remain lazy-loaded to avoid unrelated cold-start failures.
import * as inventoryPublic from '../server-api/inventory-public';

const loaders: Record<string, () => Promise<any>> = {
  'ai-lead-assistant': () => import('../server-api/ai-lead-assistant'),
  'assigned-lead-alert': () => import('../server-api/assigned-lead-alert'),
  'booking-control': () => import('../server-api/booking-control'),
  'collection-priority': () => import('../server-api/collection-priority'),
  'customer-ai': () => import('../server-api/customer-ai'),
  'customer-whatsapp': () => import('../server-api/customer-whatsapp'),
  'follow-up-automation': () => import('../server-api/follow-up-automation'),
  'follow-up-cron': () => import('../server-api/follow-up-cron'),
  'follow-up-push': () => import('../server-api/follow-up-push'),
  'followup-engine': () => import('../server-api/followup-engine'),
  'inventory-public': async () => inventoryPublic,
  'lead-assignment': () => import('../server-api/lead-assignment'),
  'lead-conversion-plan': () => import('../server-api/lead-conversion-plan'),
  'lead-match': () => import('../server-api/lead-match'),
  'lead-meta': () => import('../server-api/lead-meta'),
  'lead-property-match': () => import('../server-api/lead-property-match'),
  'lead-reengagement': () => import('../server-api/lead-reengagement'),
  'lead-response-sla': () => import('../server-api/lead-response-sla'),
  'lead-routing': () => import('../server-api/lead-routing'),
  'lead-shortlist-send': () => import('../server-api/lead-shortlist-send'),
  'leads': () => import('../server-api/leads'),
  'meta-lead-auto-route': () => import('../server-api/meta-lead-auto-route'),
  'meta-lead-webhook': () => import('../server-api/meta-lead-webhook'),
  'payment-collections': () => import('../server-api/payment-collections'),
  'payment-escalation-alert': () => import('../server-api/payment-escalation-alert'),
  'payment-escalation': () => import('../server-api/payment-escalation'),
  'payment-ledger': () => import('../server-api/payment-ledger'),
  'payment-schedule': () => import('../server-api/payment-schedule'),
  'post-visit-followup': () => import('../server-api/post-visit-followup'),
  'priority-match-queue': () => import('../server-api/priority-match-queue'),
  'properties': () => import('../server-api/properties'),
  'property-history': () => import('../server-api/property-history'),
  'property-match': () => import('../server-api/property-match'),
  'push': () => import('../server-api/push'),
  'referral-request': () => import('../server-api/referral-request'),
  'review-request': () => import('../server-api/review-request'),
  'sales-priority-queue': () => import('../server-api/sales-priority-queue'),
  'site-visit-alert': () => import('../server-api/site-visit-alert'),
  'site-visit-complete': () => import('../server-api/site-visit-complete'),
  'site-visit-reminders': () => import('../server-api/site-visit-reminders'),
  'site-visit-request': () => import('../server-api/site-visit-request'),
  'visitor': () => import('../server-api/visitor'),
  'whatsapp-webhook': () => import('../server-api/whatsapp-webhook'),
};

function routeFromRequest(req: any) {
  const explicit = req?.query?.route;
  if (explicit) return String(explicit).replace(/^\/+|\/+$/g, '');
  const raw = String(req?.url || '').split('?')[0];
  return raw.replace(/^\/api\/+/, '').replace(/\/+$/, '');
}

export default async function handler(req: any, res: any) {
  const route = routeFromRequest(req);
  const load = loaders[route];
  if (!load) return res.status(404).json({ error: 'API route not found.', route });
  try {
    const mod = await load();
    const fn = mod?.default || mod?.handler;
    if (typeof fn !== 'function') {
      return res.status(500).json({ error: 'API handler is not available.', route });
    }
    return fn(req, res);
  } catch (e: any) {
    return res.status(500).json({ error: 'API module failed to load.', route, message: String(e?.message || e) });
  }
}
