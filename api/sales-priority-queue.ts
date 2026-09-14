import type { VercelRequest, VercelResponse } from '@vercel/node';

const PASSWORD = process.env.DASHBOARD_PASSWORD || '';
const auth = (req: VercelRequest) => !PASSWORD || req.headers.authorization === `Bearer ${PASSWORD}` || String(req.headers.cookie || '').includes('crm_session=');
const rank = (p?: string) => p === 'Very Hot' ? 4 : p === 'Hot' ? 3 : p === 'Warm' ? 2 : 1;
const intent = (l: any) => { const t = [l.lead_type, l.requirement, l.message].join(' ').toLowerCase(); if (/sell|selling|seller/.test(t)) return 'SELL'; if (/invest|investment|roi|return/.test(t)) return 'INVEST'; return 'BUY'; };
const due = (v?: string) => { if (!v) return false; const d = new Date(v); return !Number.isNaN(d.getTime()) && d.getTime() <= Date.now(); };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    const h = PASSWORD ? { Authorization: `Bearer ${PASSWORD}` } : {};
    const [lr, mr] = await Promise.all([
      fetch(`${base}/api/leads?refresh=${Date.now()}`, { headers: h, cache: 'no-store' }),
      fetch(`${base}/api/lead-meta?refresh=${Date.now()}`, { headers: h, cache: 'no-store' })
    ]);
    const l = await lr.json(); const m = await mr.json();
    if (!lr.ok) return res.status(lr.status).json(l);
    const meta = m.meta || {};
    const queue = (l.leads || []).filter((lead: any) => !['Closed','Lost'].includes(meta[lead.id]?.status)).map((lead: any) => {
      const x = meta[lead.id] || {}; const priority = x.priority || 'Warm'; const followUp = x.followUp;
      const isVisit = x.status === 'Site Visit' || x.salesStage === 'SITE VISIT SCHEDULED';
      const isNegotiation = x.status === 'Negotiation' || x.salesStage === 'NEGOTIATION';
      let action = 'CALL LEAD'; let urgency = 1;
      if (due(followUp)) { action = 'FOLLOW UP NOW'; urgency = 5; }
      else if (isVisit) { action = 'CONFIRM SITE VISIT'; urgency = 5; }
      else if (isNegotiation) { action = 'PUSH NEGOTIATION'; urgency = 4; }
      else if (rank(priority) >= 3) { action = 'CALL WITHIN 5 MIN'; urgency = 4; }
      else if (rank(priority) === 2) { action = 'CALL TODAY'; urgency = 2; }
      return { id: lead.id, name: lead.name, phone: lead.phone, intent: intent(lead), location: lead.location, propertyType: lead.property_type, budget: lead.budget, priority, status: x.status || 'New', salesStage: x.salesStage || x.status || 'NEW LEAD', followUp, action, urgency, score: rank(priority), reason: due(followUp) ? 'Follow-up due' : isVisit ? 'Site visit pipeline' : isNegotiation ? 'Negotiation pipeline' : `${priority} intent` };
    }).sort((a: any, b: any) => b.urgency - a.urgency || b.score - a.score);
    return res.status(200).json({ queue, total: queue.length, generatedAt: new Date().toISOString() });
  } catch (e) { return res.status(500).json({ error: e instanceof Error ? e.message : 'Unable to build priority queue' }); }
}
