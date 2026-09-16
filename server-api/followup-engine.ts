type Lead = {
  id: string;
  name?: string;
  phone?: string;
  lead_type?: string;
};

type Meta = {
  status?: string;
  priority?: string;
  nextAction?: string;
  followUp?: string;
  timeline?: string;
  callHistory?: Array<{ id?: string; at?: string; outcome?: string; note?: string }>;
};

const CLOSED = new Set(['Closed', 'Lost']);
const STATUSES = new Set(['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost']);

function header(request: any, name: string) {
  const value = request?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function authorized(request: any) {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  return Boolean(expected && header(request, 'authorization') === `Bearer ${expected}`);
}

function todayIST() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00+05:30`);
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d);
}

function recommendation(lead: Lead, meta: Meta) {
  const status = STATUSES.has(String(meta.status || '')) ? String(meta.status) : 'New';
  const priority = ['Hot', 'Warm', 'Cold'].includes(String(meta.priority)) ? String(meta.priority) : 'Warm';
  const followUp = String(meta.followUp || '').slice(0, 10);
  const today = todayIST();

  if (CLOSED.has(status)) {
    return { action: 'No Action', followUp: '', reason: `${status} lead — follow-up stopped.` };
  }

  let action = 'Follow-up';
  let days = priority === 'Hot' ? 1 : priority === 'Cold' ? 7 : 3;
  let reason = 'Regular follow-up recommended.';

  if (status === 'New') {
    action = 'Call'; days = 1; reason = 'New lead — first contact should happen quickly.';
  } else if (status === 'Contacted') {
    action = 'Follow-up'; days = priority === 'Hot' ? 1 : 3; reason = 'Lead contacted — schedule the next follow-up.';
  } else if (status === 'Interested') {
    action = 'Confirm Site Visit'; days = 2; reason = 'Interested lead — confirm and move toward a site visit.';
  } else if (status === 'Site Visit') {
    action = 'Follow-up'; days = 1; reason = 'Site visit stage — capture feedback and move toward negotiation.';
  } else if (status === 'Negotiation') {
    action = 'Follow-up'; days = 1; reason = 'Negotiation stage — closing follow-up is the priority.';
  }

  const last = Array.isArray(meta.callHistory) && meta.callHistory.length ? meta.callHistory[meta.callHistory.length - 1] : undefined;
  const signal = `${String(last?.outcome || '')} ${String(last?.note || '')}`.toLowerCase();
  if (signal.includes('no response') || signal.includes('not reachable') || signal.includes('no answer') || signal.includes('busy')) {
    action = 'Call'; days = 1; reason = 'Recent contact signal indicates another call attempt is needed.';
  }

  const suggestedDate = followUp && followUp >= today ? followUp : addDays(today, days);
  return { action, followUp: suggestedDate, reason, currentFollowUp: followUp, leadId: lead.id, name: lead.name || '', phone: lead.phone || '', priority, status };
}

async function getJson(url: string, token: string) {
  const result = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!result.ok) throw new Error(`Request failed: ${result.status}`);
  return result.json();
}

export default async function handler(request: any, response: any) {
  if (!authorized(request)) return response.status(401).json({ error: 'Unauthorized' });
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });

  try {
    const token = process.env.DASHBOARD_PASSWORD || '';
    const base = `https://${request.headers.host}`;
    const [leadsData, metaData] = await Promise.all([
      getJson(`${base}/api/leads`, token),
      getJson(`${base}/api/lead-meta`, token)
    ]);
    const leads: Lead[] = Array.isArray(leadsData?.leads) ? leadsData.leads : [];
    const meta: Record<string, Meta> = metaData?.meta && typeof metaData.meta === 'object' ? metaData.meta : {};
    const recommendations = leads.map(lead => recommendation(lead, meta[lead.id] || {}));
    return response.status(200).setHeader('Cache-Control', 'no-store').json({ ok: true, generatedAt: new Date().toISOString(), today: todayIST(), recommendations });
  } catch (error) {
    console.error('followup-engine error', error);
    return response.status(500).json({ error: 'Unable to generate follow-up recommendations.' });
  }
}
