const AUTH = process.env.DASHBOARD_PASSWORD || '';
const ok = (req: any) => !AUTH || req.headers?.authorization === `Bearer ${AUTH}`;
const daysSince = (value?: string) => {
  if (!value) return 999;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 999 : Math.max(0, Math.floor((Date.now() - t) / 86400000));
};
const cleanPhone = (v?: string) => String(v || '').replace(/\D/g, '');

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!ok(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const base = `${req.headers?.['x-forwarded-proto'] || 'https'}://${req.headers?.host || ''}`;
    const headers = AUTH ? { Authorization: `Bearer ${AUTH}` } : {};
    const [lr, mr] = await Promise.all([
      fetch(`${base}/api/leads?refresh=${Date.now()}`, { headers, cache: 'no-store' }),
      fetch(`${base}/api/lead-meta?refresh=${Date.now()}`, { headers, cache: 'no-store' })
    ]);
    const ld = await lr.json(); const md = await mr.json();
    if (!lr.ok) return res.status(lr.status).json(ld);
    const meta = md.meta || {};
    const leads = (ld.leads || []).filter((l: any) => {
      const s = String(meta[l.id]?.status || '').toLowerCase();
      return s !== 'closed' && s !== 'lost' && cleanPhone(l.phone);
    });
    const queue = leads.map((lead: any) => {
      const m = meta[lead.id] || {};
      const last = m.lastContactAt || m.last_contact_at || lead.updated_at || lead.created_at;
      const age = daysSince(last);
      const priority = String(m.priority || '').toLowerCase();
      const score = Number(m.score || lead.score || 0);
      let action = 'MONITOR'; let urgency = 0; let message = '';
      if (age >= 14) { action = 'RE-ENGAGE NOW'; urgency = 5; message = `Hello ${lead.name || ''}, checking if your property requirement is still active. I can share fresh matching options.`; }
      else if (age >= 7) { action = 'FOLLOW UP TODAY'; urgency = 4; message = `Hello ${lead.name || ''}, we have new property options matching your requirement. Would you like me to share the best options?`; }
      else if (age >= 3 && (priority === 'hot' || priority === 'very hot' || score >= 55)) { action = 'HIGH-INTENT FOLLOW UP'; urgency = 4; message = `Hello ${lead.name || ''}, following up on your requirement. Can we shortlist the best option or schedule a site visit?`; }
      else return null;
      const phone = cleanPhone(lead.phone);
      return { id: lead.id, name: lead.name || 'Lead', phone, intent: lead.lead_type || 'BUY', location: lead.location || '', propertyType: lead.property_type || '', priority: m.priority || 'Warm', score, lastContactAt: last, daysSinceContact: age, action, urgency, message, whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` };
    }).filter(Boolean).sort((a: any, b: any) => b.urgency - a.urgency || b.daysSinceContact - a.daysSinceContact).slice(0, 25);
    return res.status(200).json({ generatedAt: new Date().toISOString(), count: queue.length, queue });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unable to build re-engagement queue' });
  }
}
