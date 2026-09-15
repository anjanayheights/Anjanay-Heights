import { createHmac, timingSafeEqual } from 'node:crypto';
import { get, list, put } from '@vercel/blob';
import { notifyNewLead } from './push';

const auths = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];

async function blob<T>(fn: (a: any) => Promise<T>) {
  let last: any;
  for (const a of [{}, ...auths]) {
    try { return await fn(a); } catch (e) { last = e; }
  }
  throw last;
}

async function read(url: string) {
  const r: any = await blob((a) => get(url, { access: 'private', useCache: false, ...a }));
  return r?.stream ? await new Response(r.stream).json() : null;
}

function verifySignature(raw: string, signature: string) {
  const secret = process.env.META_APP_SECRET || '';
  if (!secret || !signature) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch { return false; }
}

function normalizePhone(value: any) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function fieldMap(fieldData: any[]) {
  const out: Record<string, string> = {};
  for (const item of Array.isArray(fieldData) ? fieldData : []) {
    const key = String(item?.name || '').trim().toLowerCase();
    const value = String(item?.values?.[0] ?? '').trim();
    if (key && value) out[key] = value;
  }
  return out;
}

async function loadLeadByPhone(phone: string) {
  const r: any = await blob((a) => list({ prefix: 'leads/', ...a }));
  for (const b of r.blobs || []) {
    try {
      const lead: any = await read(b.url);
      if (normalizePhone(lead?.phone) === phone) return lead;
    } catch {}
  }
  return null;
}

async function loadMeta() {
  try {
    const r: any = await blob((a) => list({ prefix: 'crm/lead-meta.json', ...a }));
    return r.blobs?.[0] ? (await read(r.blobs[0].url) || {}) : {};
  } catch { return {}; }
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const mode = req.query?.['hub.mode'];
    const token = req.query?.['hub.verify_token'];
    const challenge = req.query?.['hub.challenge'];
    if (mode === 'subscribe' && token && token === process.env.META_VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).send('Forbidden');
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const signature = req.headers?.['x-hub-signature-256'] || req.headers?.get?.('x-hub-signature-256') || '';
  if (!verifySignature(raw, signature)) return res.status(401).json({ error: 'Invalid signature' });

  try {
    const body = JSON.parse(raw);
    if (body?.object !== 'page') return res.status(200).json({ ok: true, ignored: true });

    const changes = (body.entry || []).flatMap((entry: any) =>
      (entry.changes || []).map((change: any) => ({ pageId: entry.id, change }))
    );
    const leadEvents = changes.filter((x: any) => x.change?.field === 'leadgen' && x.change?.value?.leadgen_id);
    if (!leadEvents.length) return res.status(200).json({ ok: true, processed: 0 });

    const token = process.env.META_ACCESS_TOKEN || '';
    const version = process.env.META_GRAPH_VERSION || 'v23.0';
    if (!token) return res.status(503).json({ error: 'META_ACCESS_TOKEN is not configured' });

    const meta = await loadMeta();
    let created = 0;
    let updated = 0;

    for (const event of leadEvents) {
      const leadgenId = String(event.change.value.leadgen_id);
      const url = `https://graph.facebook.com/${version}/${encodeURIComponent(leadgenId)}?fields=id,created_time,field_data,ad_id,adset_id,campaign_id,form_id&access_token=${encodeURIComponent(token)}`;
      const response = await fetch(url);
      if (!response.ok) continue;
      const remote: any = await response.json();
      const fields = fieldMap(remote.field_data);
      const name = fields.full_name || fields.name || fields.first_name || 'Meta Lead';
      const phone = normalizePhone(fields.phone_number || fields.phone || fields.mobile || '');
      if (!phone) continue;

      const existing = await loadLeadByPhone(phone);
      const now = new Date().toISOString();
      const leadId = existing?.id || `meta-${leadgenId}`;
      const lead = {
        ...(existing || {}),
        id: leadId,
        name,
        phone,
        email: fields.email || existing?.email || '',
        source: existing?.source || 'meta-lead-ads',
        property_name: fields.property || fields.project || fields.project_name || existing?.property_name || '',
        property_type: fields.property_type || existing?.property_type || '',
        location: fields.location || fields.city || existing?.location || '',
        budget: fields.budget || existing?.budget || '',
        bhk: fields.bhk || existing?.bhk || '',
        timeline: fields.timeline || existing?.timeline || '',
        message: fields.message || existing?.message || '',
        metaLeadgenId: leadgenId,
        metaPageId: String(event.pageId || ''),
        metaAdId: String(remote.ad_id || event.change.value.ad_id || ''),
        metaAdsetId: String(remote.adset_id || event.change.value.adset_id || ''),
        metaCampaignId: String(remote.campaign_id || event.change.value.campaign_id || ''),
        metaFormId: String(remote.form_id || event.change.value.form_id || ''),
        updatedAt: now,
        createdAt: existing?.createdAt || remote.created_time || now,
      };

      const key = `leads/${leadId}.json`;
      await blob((a) => put(key, JSON.stringify(lead), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', ...a }));

      const old = meta[leadId] || {};
      meta[leadId] = {
        ...old,
        status: old.status || 'New',
        priority: old.priority || 'Hot',
        nextAction: old.nextAction || 'Call Lead',
        salesStage: old.salesStage || 'NEW LEAD',
        source: 'meta-lead-ads',
        metaLeadgenId: leadgenId,
        metaCampaignId: lead.metaCampaignId,
        metaAdsetId: lead.metaAdsetId,
        metaAdId: lead.metaAdId,
        lastMetaLeadAt: now,
        history: [...(old.history || []), { id: `meta-${Date.now()}-${leadgenId}`, at: now, action: existing ? 'Meta Lead Updated' : 'Meta Lead Captured', note: `Lead captured from Meta Lead Ads (${lead.metaCampaignId || 'campaign unknown'}).` }],
      };

      if (existing) updated++; else created++;
      try { await notifyNewLead({ id: leadId, name: lead.name, phone: lead.phone, source: 'meta-lead-ads', priority: meta[leadId].priority, nextAction: meta[leadId].nextAction }); } catch {}
    }

    if (created || updated) {
      await blob((a) => put('crm/lead-meta.json', JSON.stringify(meta), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', ...a }));
    }

    return res.status(200).json({ ok: true, processed: created + updated, created, updated });
  } catch (e) {
    console.error('Meta lead webhook error', e);
    return res.status(500).json({ error: 'Meta lead webhook processing failed' });
  }
}
