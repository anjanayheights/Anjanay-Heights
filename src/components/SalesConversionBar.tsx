import { useEffect, useState } from 'react';

const WHATSAPP = '919289771222';
const CALL = 'tel:+919289771222';

export default function SalesConversionBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 280);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatsapp = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi Anjanay Heights, I want help finding the right property. Please share suitable options and site visit availability.')}`;

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 hidden md:flex flex-col gap-2">
        <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-xl hover:scale-105 transition-transform">💬 WhatsApp Sales</a>
        <a href="tel:+919289771222" className="rounded-full bg-white border border-slate-200 px-5 py-3 text-sm font-bold text-[#1A365D] shadow-xl hover:scale-105 transition-transform">📞 Call Sales</a>
        
      </div>
      <div className={`fixed inset-x-0 bottom-0 z-50 md:hidden transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="grid grid-cols-3 gap-px bg-white border-t border-slate-200 shadow-2xl">
          <a href={CALL} className="flex items-center justify-center py-3 bg-white text-[#1A365D] text-[11px] font-bold uppercase tracking-wide">📞 Call</a>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-center py-3 bg-[#25D366] text-white text-[11px] font-bold uppercase tracking-wide">💬 WhatsApp</a>
          <a href="#contact" className="flex items-center justify-center py-3 bg-[#1A365D] text-white text-[11px] font-bold uppercase tracking-wide">📅 Visit</a>
        </div>
      </div>
    </>
  );
}
