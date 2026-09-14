import { FormEvent, useState } from 'react';

type Result = { priority?: string; score?: number; followUp?: string; duplicate?: boolean };

const PROPERTY_OPTIONS = [
  'NCR Monarch',
  'Godrej Majesty',
  'VVIP Addresses Greater Noida West',
  'YEIDA RPS 02 Residential Plot',
  'ACE YXP Commercial',
  'Express Astra',
  'Gaurs 7th Avenue',
  'Gaurs 14th Avenue',
  '100 Beds Hospital – Faridabad',
  '110 Bigha Commercial Land – Haridwar',
  '710 sq ft Flat – Sector 1, Aminabad',
  'Other / Not sure',
];

export default function PropertyEnquiryForm() {
  const [submitted, setSubmitted] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data as any).toString(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit enquiry');
      setSubmitted(result);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit enquiry');
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <section id="property-enquiry" className="py-16 bg-[#1A365D] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-4xl">✓</div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2A36B]">Enquiry received</p>
          <h2 className="mt-2 text-3xl font-serif">Your property enquiry is with the sales team.</h2>
          <p className="mt-3 text-sm text-white/75">We have saved the requirement and will use the requested property, location and budget to guide the next conversation.</p>
          {submitted.priority && <div className="mt-6 inline-flex flex-wrap justify-center gap-3 text-xs"><span className="rounded-full border border-white/20 px-4 py-2">Priority: <strong>{submitted.priority}</strong></span>{typeof submitted.score === 'number' && <span className="rounded-full border border-white/20 px-4 py-2">Lead score: <strong>{submitted.score}/100</strong></span>}{submitted.duplicate && <span className="rounded-full border border-white/20 px-4 py-2">Existing phone matched</span>}</div>}
          {submitted.followUp && <p className="mt-5 text-sm text-white/80">Next follow-up scheduled: <strong className="text-white">{new Date(submitted.followUp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong></p>}
          <button type="button" onClick={() => setSubmitted(null)} className="mt-7 rounded-xl bg-[#C2A36B] px-6 py-3 text-sm font-bold text-[#1A365D]">Submit another enquiry</button>
        </div>
      </section>
    );
  }

  return (
    <section id="property-enquiry" className="py-16 bg-[#F5F7FA] border-y border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
          <div className="lg:sticky lg:top-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2A36B]">Property enquiry</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-serif font-light text-[#1A365D]">Interested in a specific property?</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">Send the property name with your requirement. The enquiry is saved directly into the Anjanay Heights lead flow for follow-up.</p>
            <div className="mt-6 space-y-2 text-xs text-slate-600"><p>✓ Genuine enquiry goes to the CRM lead pipeline</p><p>✓ Phone-based duplicate protection stays active</p><p>✓ Lead score and Hot/Warm/Cold priority are calculated automatically</p><p>✓ Urgent/site-visit requirements receive faster follow-up</p></div>
          </div>
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7 shadow-sm space-y-4">
            <input type="hidden" name="form-name" value="property-enquiry" />
            <input type="hidden" name="source" value="Property Enquiry" />
            <input type="hidden" name="lead_type" value="Property Enquiry" />
            <p className="hidden"><label>Don’t fill this out if you're human: <input name="bot-field" /></label></p>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label htmlFor="property-enquiry-name" className="block text-sm font-medium text-slate-700">Name</label><input id="property-enquiry-name" name="name" required className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3" /></div>
              <div><label htmlFor="property-enquiry-phone" className="block text-sm font-medium text-slate-700">Phone</label><input id="property-enquiry-phone" name="phone" type="tel" inputMode="tel" required className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3" /></div>
            </div>
            <div><label htmlFor="property-enquiry-property" className="block text-sm font-medium text-slate-700">Property</label><select id="property-enquiry-property" name="property_name" defaultValue="" required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="" disabled>Select a property</option>{PROPERTY_OPTIONS.map((property) => <option key={property} value={property}>{property}</option>)}</select></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label htmlFor="property-enquiry-type" className="block text-sm font-medium text-slate-700">Property type</label><select id="property-enquiry-type" name="property_type" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"><option>Flat</option><option>Villa</option><option>Residential Plot</option><option>Commercial Land</option><option>Commercial</option><option>Hospital</option><option>Any</option></select></div>
              <div><label htmlFor="property-enquiry-location" className="block text-sm font-medium text-slate-700">Preferred location</label><input id="property-enquiry-location" name="location" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="e.g. Greater Noida West" /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label htmlFor="property-enquiry-budget" className="block text-sm font-medium text-slate-700">Budget</label><input id="property-enquiry-budget" name="budget" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="e.g. ₹1 crore" /></div>
              <div><label htmlFor="property-enquiry-timeline" className="block text-sm font-medium text-slate-700">Timeline</label><select id="property-enquiry-timeline" name="timeline" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"><option>Immediate</option><option>Within 7 days</option><option>Within 1 month</option><option>Researching</option></select></div>
            </div>
            <div><label htmlFor="property-enquiry-intent" className="block text-sm font-medium text-slate-700">What would you like next?</label><select id="property-enquiry-intent" name="next_step" defaultValue="" required className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="" disabled>Select your next step</option><option value="Site visit within 7 days">Site visit within 7 days</option><option value="Shortlist & price discussion">Shortlist & price discussion</option><option value="Just researching">Just researching</option></select></div>
            <div><label htmlFor="property-enquiry-requirement" className="block text-sm font-medium text-slate-700">Requirement / site visit note</label><textarea id="property-enquiry-requirement" name="requirement" rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Tell us what you need or when you would like a site visit." /></div>
            <button disabled={saving} className="w-full rounded-xl bg-[#1A365D] px-5 py-3.5 text-white font-bold hover:opacity-95 disabled:opacity-60">{saving ? 'Saving enquiry…' : 'Get Best Options & Site Visit'}</button>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
