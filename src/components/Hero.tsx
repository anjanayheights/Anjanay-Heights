import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'motion/react';

const WHATSAPP = '919289771222';

export default function Hero() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [attribution, setAttribution] = useState({ source: 'Website', utm_source: '', utm_medium: '', utm_campaign: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source') || params.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : 'Website');
    setAttribution({ source, utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || '' });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(formData as any).toString() });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Form submission failed');
      const leadName = String(formData.get('name') || 'there');
      const property = String(formData.get('property_type') || 'property');
      setWhatsappMessage(`Hi Anjanay Heights, I just submitted a request for a ${property}. My name is ${leadName}. Please share suitable options and next steps.`);
      setSubmitted(true);
      form.reset();
    } catch (error) {
      console.error(error);
      alert('Unable to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const directWhatsApp = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi Anjanay Heights, I am looking for a property. Please help me with suitable options and a site visit.')}`;

  return (
    <section id="home" className="relative pt-32 pb-0 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-0 border-x border-t border-gray-200 mx-4 sm:mx-6 lg:mx-8 mb-12 shadow-sm">
          <div className="md:col-span-8 p-8 md:p-12 lg:p-16 bg-white flex flex-col justify-center relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-block px-3 py-1 bg-[#F1EDE4] text-[#8C7345] text-[10px] font-bold uppercase tracking-widest mb-6 border border-[#DED4C1] self-start">RERA Approved Properties</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1A365D] mb-6 leading-tight font-light">Real Estate Consultant in <span className="italic font-serif">Noida, Greater Noida & NCR</span></motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-sm md:text-base text-gray-600 mb-7 max-w-xl leading-relaxed">Anjanay Heights is a property consultant for buying, selling and investment in Noida and Greater Noida, helping clients find apartments, villas, plots, commercial property and institutional projects—from requirement matching to site visit and closing.</motion.p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-[#1A365D] mb-9"><span>✓ Residential Property Consulting</span><span>✓ Commercial Property Consulting</span><span>✓ Property Investment Assistance</span><span>✓ Site Visit Assistance</span></div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="flex flex-col sm:flex-row items-start gap-3">
              <a href="#properties" className="w-full sm:w-auto bg-[#C2A36B] text-white px-8 py-3.5 text-sm font-bold uppercase tracking-widest hover:bg-[#A98D59] transition-colors flex items-center justify-center">Explore Properties</a>
              <a href="#contact" className="w-full sm:w-auto border border-[#1A365D] text-[#1A365D] px-8 py-3.5 text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center">Book Site Visit</a>
              <a href={directWhatsApp} target="_blank" rel="noreferrer" className="w-full sm:w-auto bg-[#25D366] text-white px-8 py-3.5 text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-colors flex items-center justify-center">WhatsApp an Expert</a>
            </motion.div>
            <div className="mt-6 text-[11px] text-gray-500">Prefer a call? <a href="tel:+919289771222" className="font-bold text-[#1A365D] underline">+91 92897 71222</a> · Sales team available for property enquiries.</div>
          </div>

          <div className="md:col-span-4 bg-[#1A365D] p-8 md:p-10 flex flex-col justify-center text-white relative border-l border-[#C2A36B]/30">
            {!submitted ? (
              <>
                <div className="mb-8"><div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">Priority Registration</div><h3 className="text-2xl font-serif mb-2">Get Matched Faster</h3><p className="text-xs text-white/70 leading-relaxed">Tell us your requirement once. We’ll shortlist suitable options and help arrange the next step.</p></div>
                <form name="property-lead" method="POST" onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="form-name" value="property-lead" /><input type="hidden" name="source" value={attribution.source} /><input type="hidden" name="utm_source" value={attribution.utm_source} /><input type="hidden" name="utm_medium" value={attribution.utm_medium} /><input type="hidden" name="utm_campaign" value={attribution.utm_campaign} />
                  <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" className="hidden" />
                  <input type="text" name="name" placeholder="Your Name" required className="w-full px-4 py-3.5 bg-white text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B]" />
                  <input type="tel" name="phone" placeholder="WhatsApp / Phone Number" required className="w-full px-4 py-3.5 bg-white text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B]" />
                  <select name="lead_type" defaultValue="" required className="w-full px-4 py-3.5 bg-white text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B]"><option value="" disabled>Looking to...</option><option value="buy">Buy Property</option><option value="sell">Sell Property</option><option value="invest">Invest</option></select>
                  <select name="property_type" defaultValue="" required className="w-full px-4 py-3.5 bg-white text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B]"><option value="" disabled>Property Type</option><option value="apartment">Apartment / Flat</option><option value="villa">Villa</option><option value="plot">Residential Plot</option><option value="commercial">Commercial Property</option><option value="office">Office Space</option><option value="shop">Shop / Retail</option><option value="hospital">Hospital / Institutional</option><option value="other">Other</option></select>
                  <select name="location" defaultValue="" required className="w-full px-4 py-3.5 bg-white text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B]"><option value="" disabled>Preferred Location</option><option value="central-noida">Central Noida</option><option value="noida-extension">Noida Extension</option><option value="greater-noida">Greater Noida</option><option value="greater-noida-west">Greater Noida West</option><option value="other">Other</option></select>
                  <select name="budget" defaultValue="" required className="w-full px-4 py-3.5 bg-white text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B]"><option value="" disabled>Budget / Expected Price</option><option value="under-50l">Under ₹50 Lakhs</option><option value="50l-1cr">₹50 Lakhs – ₹1 Crore</option><option value="1cr-3cr">₹1 Crore – ₹3 Crores</option><option value="3cr-5cr">₹3 Crores – ₹5 Crores</option><option value="above-5cr">Above ₹5 Crores</option></select>
                  <select name="timeline" defaultValue="" required className="w-full px-4 py-3.5 bg-white text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B]"><option value="" disabled>Timeline</option><option value="immediate">Immediately</option><option value="1-3-months">Within 1–3 Months</option><option value="3-6-months">Within 3–6 Months</option><option value="6-plus-months">After 6 Months</option></select>
                  <textarea name="requirement" rows={2} placeholder="Specific requirement (optional)" className="w-full px-4 py-3.5 bg-white text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] resize-none" />
                  <button type="submit" disabled={submitting} className="w-full bg-[#C2A36B] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#A98D59] transition-colors mt-2 disabled:opacity-60">{submitting ? 'Submitting...' : 'Get Matched With Properties'}</button>
                </form>
                <div className="mt-6 flex items-center justify-center space-x-2 text-[10px] text-white/50 border-t border-white/10 pt-5"><span className="text-[#C2A36B] text-sm">🔒</span><span>Your information is secure. No spam.</span></div>
              </>
            ) : (
              <div className="text-center py-10"><div className="text-[#C2A36B] text-5xl mb-5">✓</div><h3 className="text-2xl font-serif mb-3">Your request is in.</h3><p className="text-sm text-white/70 leading-relaxed">Our sales team has your requirement. For the fastest response, continue directly on WhatsApp.</p><a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex w-full items-center justify-center bg-[#25D366] text-white px-6 py-3.5 text-xs font-bold uppercase tracking-widest hover:opacity-90">Continue on WhatsApp</a><button type="button" onClick={() => setSubmitted(false)} className="mt-4 border border-[#C2A36B] text-[#C2A36B] px-6 py-3 text-xs font-bold uppercase tracking-widest">Submit Another Request</button></div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
