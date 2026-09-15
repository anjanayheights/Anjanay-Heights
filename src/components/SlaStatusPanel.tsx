import React, { useEffect, useMemo, useState } from 'react';

type Lead = { id?: string; name?: string; phone?: string; created_at?: string; status?: string; priority?: string };
type Meta = Record<string, { callHistory?: unknown[]; status?: string; priority?: string; nextAction?: string }>;

function ageMinutes(value?: string) {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 60000)) : 0;
}

export default function SlaStatusPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Meta>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [a, b] = await Promise.all([
          fetch('/api/leads', { credentials: 'include' }),
          fetch('/api/lead-meta', { credentials: 'include' }),
        ]);
        const leadData = await a.json().catch(() => []);
        const metaData = await b.json().catch(() => ({}));
        if (!active) return;
        setLeads(Array.isArray(leadData) ? leadData : Array.isArray(leadData?.leads) ? leadData.leads : []);
        setMeta(metaData?.meta || metaData || {});
      } finally { if (active) setLoading(false); }
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const items = useMemo(() => leads.map((lead) => {
    const m = meta[lead.id || ''] || {};
    const age = ageMinutes(lead.created_at);
    const contacted = Boolean(m.callHistory?.length);
    const breached = !contacted && age >= 15 && m.status !== 'Closed' && m.status !== 'Lost';
    return { lead, age, contacted, breached, remaining: Math.max(0, 15 - age) };
  }).filter(x => !x.contacted && x.lead.status !== 'Closed' && x.lead.status !== 'Lost').sort((a, b) => Number(b.breached) - Number(a.breached) || b.age - a.age), [leads, meta]);

  if (loading) return <div className="rounded-xl border p-4 text-sm">Loading response SLA…</div>;

  return <section className="rounded-xl border p-4 space-y-3">
    <div className="flex items-center justify-between gap-3">
      <div><h3 className="font-semibold">Lead Response SLA</h3><p className="text-xs opacity-70">Contact every fresh lead within 15 minutes.</p></div>
      <div className="text-xs font-medium">{items.filter(x => x.breached).length} breached</div>
    </div>
    {items.length === 0 ? <div className="text-sm opacity-70">No pending response leads.</div> : <div className="space-y-2">
      {items.slice(0, 8).map(({ lead, age, breached, remaining }) => <div key={lead.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
        <div className="min-w-0"><div className="font-medium truncate">{lead.name || 'New lead'}</div><div className="text-xs opacity-70">{lead.phone || 'No phone'} · {breached ? `SLA breached ${age - 15}m ago` : `${remaining}m remaining`}</div></div>
        <div className="flex gap-2"><a className="rounded-md border px-3 py-1.5 text-xs" href={lead.phone ? `tel:${lead.phone}` : '#'}>Call</a><a className="rounded-md border px-3 py-1.5 text-xs" href={lead.phone ? `https://wa.me/${String(lead.phone).replace(/\D/g, '')}` : '#'} target="_blank" rel="noreferrer">WhatsApp</a>{lead.id && <a className="rounded-md border px-3 py-1.5 text-xs" href={`/admin/leads?lead=${encodeURIComponent(lead.id)}`}>Open Lead</a>}</div>
      </div>)}
    </div>}
  </section>;
}
