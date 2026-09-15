import { createHmac } from 'node:crypto';

const json = (res: any, status: number, body: unknown) => res.status(status).setHeader('Cache-Control', 'no-store').json(body);
const header = (req: any, name: string) => { const h = req?.headers; if (h && typeof h.get === 'function') return h.get(name) || ''; return h?.[name.toLowerCase()] || h?.[name] || ''; };
const authorized = (req: any) => { const password = process.env.DASHBOARD_PASSWORD || ''; const bearer = header(req, 'authorization'); if (password && bearer === `Bearer ${password}`) return true; const cookie = String(header(req, 'cookie') || ''); const token = password ? createHmac('sha256', password).update('anjanay-heights-crm-session').digest('hex') : ''; return Boolean(token && cookie.split(';').some((v: string) => v.trim() === `ah_crm_session=${encodeURIComponent(token)}`)); };
const phone = (v: unknown) => { const d = String(v || '').replace(/\D/g, ''); return d.length === 10 ? `91${d}` : d; };
const safe = (v: unknown, max = 160) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' });
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(String(req.body || '{}'));
    const leadId = safe(body.leadId, 120);
    const name = safe(body.name || 'Customer', 80);
    const customerPhone = phone(body.phone);
    const matches = Array.isArray(body.matches) ? body.matches.slice(0, 3) : [];
    if (!leadId || !customerPhone) return json(res, 400, { error: 'leadId and customer phone are required' });
    if (!matches.length) return json(res, 400, { error: 'No matched properties available' });
    const lines = matches.map((m: any, i: number) => {
      const p = m?.property || m || {};
      const title = safe(p.title || p.name || 'Property', 100);
      const location = safe(p.location || 'NCR', 80);
      const price = safe(p.price || p.minBudget || 'Price on request', 60);
      const bhk = safe(p.bedrooms || p.bhk || '', 20);
      return `${i + 1}. ${title} — ${location}${bhk ? ` — ${bhk} BHK` : ''} — ${price}`;
    }).join('\n');
    const text = `Hi ${name}, 👋\n\nBased on your requirement, ANJANAY HEIGHTS has shortlisted these available options:\n\n${lines}\n\nWould you like to visit any of these properties? Reply YES with your preferred date/time and our consultant will arrange the site visit.\n\nANJANAY HEIGHTS\nNoida • Greater Noida • NCR`;
    const token = process.env.WHATSAPP_ACCESS_TOKEN || '';
    const numberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    if (!token || !numberId) return json(res, 503, { error: 'WhatsApp Cloud API is not configured.' });
    const version = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
    const wa = await fetch(`https://graph.facebook.com/${version}/${numberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: customerPhone, type: 'text', text: { preview_url: false, body: text } }) });
    const waBody = await wa.json().catch(() => ({}));
    if (!wa.ok) return json(res, 502, { error: 'WhatsApp message failed', detail: waBody });

    // Reuse the existing CRM metadata writer so the action appears in the lead history.
    const base = `${header(req, 'x-forwarded-proto') || 'https'}://${header(req, 'host') || ''}`;
    const authHeader = header(req, 'authorization');
    const metaHeaders: Record<string, string> = { 'content-type': 'application/json' };
    if (authHeader) metaHeaders.authorization = authHeader;
    try {
      await fetch(`${base}/api/lead-meta`, { method: 'POST', headers: metaHeaders, body: JSON.stringify({ leadId, meta: { activity: { action: 'WhatsApp Shortlist Sent', note: `Sent ${matches.length} matched properties to ${customerPhone}.` } } }) });
    } catch (error) { console.error('shortlist CRM history update failed', error); }

    return json(res, 200, { ok: true, sent: true, leadId, recipient: customerPhone, propertyCount: matches.length, messageId: waBody?.messages?.[0]?.id || '', sentAt: new Date().toISOString() });
  } catch (error) {
    console.error('lead shortlist send error', error);
    return json(res, 500, { error: 'Unable to send property shortlist.' });
  }
}
