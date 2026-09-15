import { get, list } from '@vercel/blob';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const auth = (req: Request) => { const expected = process.env.CRM_PASSWORD || process.env.ADMIN_PASSWORD; if (!expected) return true; return (req.headers.get('authorization') || '') === `Bearer ${expected}`; };
const num = (v: unknown) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; };
const money = (v: unknown) => num(v) || 0;

export default async function handler(req: Request) {
  if (!auth(req)) return json({ error: 'Unauthorized' }, 401);
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const leadId = new URL(req.url).searchParams.get('lead');
  if (!leadId) return json({ error: 'lead is required' }, 400);
  try {
    const [leadList, metaBlob, inventory] = await Promise.all([
      list({ prefix: 'leads/', limit: 1000 }),
      get('crm/lead-meta.json', { access: 'private' }),
      list({ prefix: 'crm/properties/item-', limit: 1000 }),
    ]);
    const leadEntry = leadList.blobs.find((x) => x.pathname.includes(leadId));
    if (!leadEntry) return json({ error: 'Lead not found' }, 404);
    const leadResponse = await fetch(leadEntry.url);
    const lead: any = await leadResponse.json();
    const meta = metaBlob ? await (await fetch(metaBlob.downloadUrl)).json() : {};
    const m: any = meta?.meta?.[leadId] || meta?.[leadId] || {};
    const all = await Promise.all(inventory.blobs.slice(0, 300).map(async (b) => { try { return await (await fetch(b.url)).json(); } catch { return null; } }));
    const location = String(lead.location || '').toLowerCase();
    const type = String(lead.property_type || '').toLowerCase();
    const bhk = num(lead.bhk);
    const budget = money(lead.budget);
    const matches = all.filter(Boolean).filter((p: any) => String(p.status || 'Available').toLowerCase() === 'available').map((p: any) => {
      let score = 0; const reasons: string[] = [];
      const pl = String(p.location || '').toLowerCase(); const pt = String(p.type || p.property_type || '').toLowerCase(); const pb = num(p.budget || p.maxBudget || p.price); const bedrooms = num(p.bedrooms || p.bhk);
      if (location && pl.includes(location)) { score += 40; reasons.push('location match'); }
      if (type && pt.includes(type)) { score += 25; reasons.push('property type match'); }
      if (bhk && bedrooms === bhk) { score += 20; reasons.push('BHK match'); }
      if (budget && pb && pb <= budget) { score += 15; reasons.push('budget fit'); }
      return { property: p, score, reasons };
    }).sort((a: any, b: any) => b.score - a.score).slice(0, 3);
    const stage = String(m.salesStage || m.status || lead.status || 'NEW LEAD').toUpperCase();
    const siteVisit = /SITE VISIT/.test(stage) ? 'Confirm the scheduled site visit' : matches.length ? 'Send top 3 property shortlist' : 'Clarify requirement before matching';
    const nextAction = /NEGOTIATION|BOOKING/.test(stage) ? 'Push commercial closure' : siteVisit;
    const probability = Math.min(95, Math.max(10, (lead.phone ? 15 : 0) + (lead.budget ? 15 : 0) + (lead.location ? 15 : 0) + (matches.length * 12) + (m.siteVisitStatus === 'Completed' ? 25 : 0) + (['Hot','Very Hot'].includes(m.priority) ? 15 : 0)));
    return json({ ok: true, leadId, stage, conversionProbability: probability, nextAction, siteVisitAction: siteVisit, matches, generatedAt: new Date().toISOString() });
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Unable to build conversion plan' }, 500); }
}
