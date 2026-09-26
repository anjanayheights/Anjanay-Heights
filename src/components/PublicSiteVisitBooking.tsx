import { useState } from 'react';

export default function PublicSiteVisitBooking() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '11:00', note: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/site-visit-request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to book site visit.');
      setSubmitted(true);
      if (d.whatsapp) window.setTimeout(() => window.open(d.whatsapp, '_blank', 'noopener,noreferrer'), 350);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to book site visit.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setSubmitted(false); }} className="fixed bottom-5 right-[230px] z-40 hidden md:block rounded-full bg-[#1A365D] px-5 py-3 text-sm font-bold text-white shadow-xl hover:scale-105 transition-transform">📅 Book Site Visit</button>
      <button onClick={() => { setOpen(true); setSubmitted(false); }} className="hidden rounded-full bg-[#1A365D] px-5 py-3 text-xs font-bold text-white shadow-xl">📅 Book Site Visit</button>
      {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#B08D57]">Anjanay Heights</p><h2 className="mt-1 text-2xl font-bold text-[#1A365D]">Book a Site Visit</h2><p className="mt-1 text-sm text-slate-500">Choose a convenient date and time. Our sales team will confirm.</p></div><button onClick={() => setOpen(false)} className="text-2xl text-slate-400" aria-label="Close">×</button></div>
          {submitted ? <div className="mt-6 rounded-xl bg-slate-50 p-5 text-center"><div className="text-3xl">✓</div><h3 className="mt-2 font-bold text-[#1A365D]">Request received</h3><p className="mt-1 text-sm text-slate-600">We have your site visit request. WhatsApp will open so you can continue the confirmation.</p><button onClick={() => setOpen(false)} className="mt-4 rounded-lg bg-[#1A365D] px-4 py-2 text-sm font-bold text-white">Done</button></div> : <form onSubmit={submit} className="mt-5 space-y-3">
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#1A365D]" />
            <input required inputMode="tel" pattern="[0-9 +()-]{10,16}" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#1A365D]" />
            <div className="grid grid-cols-2 gap-3"><input required type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm" /><select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm"><option>10:00</option><option>11:00</option><option>12:00</option><option>14:00</option><option>15:00</option><option>16:00</option><option>17:00</option></select></div>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Property / location preference (optional)" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm" />
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button disabled={loading} className="w-full rounded-lg bg-[#1A365D] px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? 'Booking…' : 'Confirm Site Visit Request'}</button>
          </form>}
        </div>
      </div>}
    </>
  );
}
