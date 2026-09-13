import React, { FormEvent, useState } from 'react';

const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data as any).toString() });
      if (!response.ok) throw new Error('Submission failed');
      setSubmitted(true);
      form.reset();
    } catch {
      setSubmitted(false);
      alert('Unable to submit right now. Please call us directly.');
    }
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">Get in touch</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-900">Tell us what you are looking for</h2>
            <p className="mt-5 text-slate-600 leading-relaxed">Share your requirement and our property consultant will contact you with suitable options.</p>
            <div className="mt-8 space-y-5 text-slate-700"><div><div className="font-semibold">Call</div><div>+91 92897 71222</div></div><div><div className="font-semibold">Email</div><div>anjanayheights@gmail.com</div></div><div><div className="font-semibold">Service area</div><div>Noida · Greater Noida · Noida Extension</div></div></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            {submitted ? <div className="py-10 text-center"><div className="text-3xl">✓</div><h3 className="mt-3 text-2xl font-bold text-slate-900">Request received</h3><p className="mt-2 text-slate-600">Thank you. Our team will contact you shortly.</p><button type="button" onClick={() => setSubmitted(false)} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-white font-semibold">Submit another request</button></div> : (
              <form name="callback" method="POST" onSubmit={handleSubmit} className="space-y-5">
                <input type="hidden" name="form-name" value="callback" /><input type="hidden" name="lead_type" value="callback" />
                <p className="hidden"><label>Don’t fill this out if you're human: <input name="bot-field" /></label></p>
                <div><label htmlFor="callback-name" className="block text-sm font-medium text-slate-700">Name</label><input id="callback-name" name="name" required className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" /></div>
                <div><label htmlFor="callback-phone" className="block text-sm font-medium text-slate-700">Phone</label><input id="callback-phone" name="phone" type="tel" inputMode="tel" required className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" /></div>
                <div><label htmlFor="callback-interest" className="block text-sm font-medium text-slate-700">Requirement</label><select id="callback-interest" name="requirement" className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 bg-white outline-none focus:border-slate-900"><option value="buy-property">Buy a property</option><option value="sell-property">Sell a property</option><option value="invest">Investment</option><option value="callback">Just call me</option></select></div>
                <div><label htmlFor="callback-property-type" className="block text-sm font-medium text-slate-700">Property type</label><select id="callback-property-type" name="property_type" className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 bg-white"><option value="Flat">Flat</option><option value="Villa">Villa</option><option value="Commercial">Commercial</option><option value="Commercial Land">Commercial Land</option><option value="Hospital">Hospital</option><option value="Any">Any property</option></select></div>
                <div><label htmlFor="callback-location" className="block text-sm font-medium text-slate-700">Preferred location</label><input id="callback-location" name="location" className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" placeholder="e.g. Greater Noida, Noida Extension" /></div>
                <div><label htmlFor="callback-budget" className="block text-sm font-medium text-slate-700">Budget</label><input id="callback-budget" name="budget" className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" placeholder="e.g. ₹40 lakh, ₹1 crore" /></div>
                <div><label htmlFor="callback-timeline" className="block text-sm font-medium text-slate-700">Buying timeline</label><select id="callback-timeline" name="timeline" className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 bg-white"><option value="Immediate">Immediate</option><option value="Within 7 days">Within 7 days</option><option value="Within 1 month">Within 1 month</option><option value="Researching">Researching</option></select></div>
                <div><label htmlFor="callback-message" className="block text-sm font-medium text-slate-700">Message</label><textarea id="callback-message" name="message" rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900" placeholder="Any specific requirement?" /></div>
                <input type="hidden" name="source" value="Website" />
                <button type="submit" className="w-full rounded-lg bg-slate-900 px-5 py-3.5 text-white font-semibold hover:bg-slate-800">Request a callback</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
