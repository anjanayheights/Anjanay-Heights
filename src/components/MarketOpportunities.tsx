import { ExternalLink, MapPin, ShieldCheck, TrendingUp } from 'lucide-react';

const opportunities = [
  { name: 'Gaur City 14th Avenue', location: 'Greater Noida West', config: '2 & 3 BHK · Ready to move', demand: 'High-volume township market', source: 'https://www.gaursonsindia.com/gaur-city-14th-avenue.php' },
  { name: 'ACE Divino', location: 'Sector 1, Greater Noida West', config: '2, 3 & 4 BHK · Ready to move', demand: 'Strong liquidity / quick-booking market', source: 'https://acegroupindia.com/ace-divino-overview.php' },
  { name: 'Godrej Nest', location: 'Sector 150, Noida', config: '3 & 4 BHK · Possession Sep 2024', demand: 'Premium Sector 150 demand', source: 'https://www.godrejproperties.com/noida/residential/godrej-nest-noida' },
  { name: 'YEIDA Residential Plot Opportunity', location: 'Sectors 15-C, 18 & 24, Yamuna Expressway', config: 'Authority residential plot scheme', demand: 'Very strong scheme demand; applications exceeded supply', source: 'https://www.yamunaexpresswayauthority.com/property/archives' },
  { name: 'Sector 150 Premium Residential Market', location: 'Sector 150, Noida', config: 'Micro-market research · no specific unit', demand: 'Premium residential corridor', source: 'https://www.magicbricks.com/Property-Rates-Trends/Multistorey-Apartment-rates-Sector-150-in-Noida' },
];

export default function MarketOpportunities() {
  return (
    <section id="market-opportunities" className="py-16 md:py-20 bg-white border-y border-[#E8E4DC]">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-[#8A6A3D] mb-3">
            <TrendingUp size={14} /> Market Research
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1A1A1A]">High-demand opportunities</h2>
          <p className="mt-3 text-[#5B5B57] leading-relaxed">Independent market opportunities researched for buyers and investors. These are third-party projects or market research, not Anjanay Heights owned inventory.</p>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {opportunities.map((item) => (
            <article key={item.name} className="rounded-2xl border border-[#E8E4DC] bg-[#FCFBF8] p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A]">{item.name}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-[#66635D]"><MapPin size={14} />{item.location}</div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#F1EDE4] px-2.5 py-1 text-[11px] font-semibold text-[#6D583B]"><ShieldCheck size={12} /> Researched</span>
              </div>
              <p className="mt-5 text-sm font-medium text-[#2D2D29]">{item.config}</p>
              <p className="mt-2 text-sm text-[#66635D]"><span className="font-semibold text-[#3C3A35]">Demand signal:</span> {item.demand}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <button type="button" onClick={() => document.getElementById('property-enquiry')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full bg-[#1A365D] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Request details</button>
                <a href={item.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D583B] hover:underline">Official/source <ExternalLink size={14} /></a>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-[#77736B]">Prices and availability are intentionally not shown here unless currently verified. Demand signals are research indicators, not a guarantee of sale or investment returns.</p>
      </div>
    </section>
  );
}
