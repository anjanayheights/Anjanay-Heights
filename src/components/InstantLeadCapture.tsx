import { FormEvent, useEffect, useState } from 'react';

const WHATSAPP = '919289771222';

export default function InstantLeadCapture() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [wa, setWa] = useState('');
  const [utm, setUtm] = useState({ source: 'website', utm_source: '', utm_medium: '', utm_campaign: '' });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setUtm({
      source: p.get('utm_source') || p.get('source') || 'website',
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
    });
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data as any).toString(),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to submit');
      const name = String(data.get('name') || 'there');
      const intent = String(data.get('lead_type') || 'buy');
      setWa(`Hi Anjanay Heights, I am ${name}. I want to ${intent} property in Noida/NCR. Please send suitable options and help me with a site visit.`);
      setDone(true);
      form.reset();
    } catch (err) {
      console.error(err);
      alert('Please try again or WhatsApp us directly.');
    } finally {
      setBusy(false);
    }
  }

  if (done) return (
    <section className="px-4 sm:px-6 lg:px-8 -mt-5 mb-8 relative z-30">
      <div className="max-w-5xl mx-auto rounded-2xl bg-[#1A365D] text-white p-5 md:p-6 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><div className="text-[#C2A36B] text-[10px] font-bold uppercase tracking-[0.2em]">Requirement received</div><div className="font-serif text-xl mt-1">Your property search is now with our sales team.</div></div>
        <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(wa)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-[#25D366] px-6 py-3 text-xs font-bold uppercase tracking-wider">Continue on WhatsApp →</a>
      </div>
    </section>
  );

  return (
    <section className="px-4 sm:px-6 lg:px-8 -mt-5 mb-8 relative z-30" aria-label="Quick property enquiry">
      <div className="max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="lg:w-[34%] shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2A36B]">30-second requirement</div>
            <h2 className="font-serif text-xl md:text-2xl text-[#1A365D] mt-1">Get suitable properties on WhatsApp</h2>
            <p className="text-xs text-slate-500 mt-1">Just name + phone. We’ll ask the details after connecting.</p>
          </div>
          <form onSubmit={submit} className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="hidden" name="source" value={utm.source} /><input type="hidden" name="utm_source" value={utm.utm_source} /><input type="hidden" name="utm_medium" value={utm.utm_medium} /><input type="hidden" name="utm_campaign" value={utm.utm_campaign} /><input type="hidden" name="property_type" value="apartment" /><input type="hidden" name="location" value="Noida/NCR" /><input type="hidden" name="budget" value="To discuss" />
            <input name="name" required placeholder="Your name" autoComplete="name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#1A365D] outline-none focus:ring-2 focus:ring-[#C2A36B]" />
            <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="WhatsApp / phone" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#1A365D] outline-none focus:ring-2 focus:ring-[#C2A36B]" />
            <select name="lead_type" defaultValue="buy" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#1A365D] outline-none focus:ring-2 focus:ring-[#C2A36B]"><option value="buy">I want to BUY</option><option value="invest">I want to INVEST</option><option value="sell">I want to SELL</option></select>
            <button disabled={busy} className="sm:col-span-3 rounded-xl bg-[#1A365D] text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-[#122844] disabled:opacity-60">{busy ? 'Connecting...' : 'Get My Property Options →'}</button>
          </form>
        </div>
      </div>
    </section>
  );
}
