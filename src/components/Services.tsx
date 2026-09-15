import { useState } from 'react';
import { motion } from 'motion/react';
import ROICalculator from './ROICalculator';

const serviceKeywords = [
  'Real Estate Consultant in Noida',
  'Property Consultant Noida',
  'Residential Property Consultant',
  'Commercial Property Consultant',
  'Property Investment Consultant',
  'Residential Plots & Land',
  'Healthcare Property Consulting',
  'Property Buying & Selling Assistance',
];

export default function Services() {
  const [propertyType, setPropertyType] = useState('All Types');
  const [location, setLocation] = useState('All Locations');
  const [priceRange, setPriceRange] = useState('Any Price');

  return (
    <section id="properties" className="py-20 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Our Portfolio & Services</div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] mb-6 font-light">Real Estate Consultant in Noida & Greater Noida</h2>
          <p className="max-w-3xl text-sm md:text-base text-gray-600 leading-relaxed">Anjanay Heights provides property consulting for buying, selling and investment across Noida, Greater Noida, Noida Extension and NCR. We assist with residential apartments, luxury homes, commercial spaces, plots and land, and healthcare projects.</p>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Real estate services">
            {serviceKeywords.map((service) => <span key={service} className="px-3 py-2 rounded-full border border-gray-200 bg-[#F9F9F7] text-[10px] font-bold uppercase tracking-wide text-[#1A365D]">{service}</span>)}
          </div>
        </div>

        <div className="mb-12 border border-gray-200 bg-[#F9F9F7] p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Property Type</label><select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"><option>All Types</option><option>Residential</option><option>Commercial</option><option>Healthcare</option><option>Plots & Land</option></select></div>
          <div className="flex-1 w-full"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Location</label><select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"><option>All Locations</option><option>Central Noida</option><option>Noida Extension</option><option>Greater Noida</option><option>Greater Noida West</option></select></div>
          <div className="flex-1 w-full"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Price Range</label><select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"><option>Any Price</option><option>Under ₹50 Lakhs</option><option>₹50 Lakhs - ₹1 Crore</option><option>₹1 Crore - ₹3 Crores</option><option>Above ₹3 Crores</option></select></div>
          <div className="w-full md:w-auto flex items-end"><button className="w-full md:w-auto bg-[#1A365D] text-white px-8 py-3 h-[46px] text-[10px] font-bold uppercase tracking-widest hover:bg-[#2D3748] transition-colors whitespace-nowrap">Find Property</button></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white border border-gray-200 p-8 flex flex-col hover:border-[#C2A36B] transition-colors"><h3 className="text-xl font-bold text-[#1A365D] mb-6 font-serif">Residential Property Consulting</h3><ul className="space-y-4 flex-1">{['2 & 3 BHK Apartments', '4 BHK Luxury Homes', 'Penthouses', 'Luxury Villas', 'Independent Floors', 'Residential Plots'].map((item, i) => <li key={i} className="text-sm text-gray-600 flex justify-between border-b border-gray-50 pb-2"><span>{item}</span><span className="text-[#C2A36B] font-bold">→</span></li>)}</ul><div className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Buying • Selling • Investment</div></motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 p-8 flex flex-col hover:border-[#C2A36B] transition-colors"><h3 className="text-xl font-bold text-[#1A365D] mb-6 font-serif">Commercial Property Consulting</h3><ul className="space-y-4 flex-1">{['Commercial Shops', 'Retail Spaces', 'Office Spaces', 'High Street Retail', 'SCO Plots', 'Business Centres', 'Food Court Investments'].map((item, i) => <li key={i} className="text-sm text-gray-600 flex justify-between border-b border-gray-50 pb-2"><span>{item}</span><span className="text-[#C2A36B] font-bold">→</span></li>)}</ul><div className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Investment • Leasing • Acquisition</div></motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-[#F1F3F5] border border-gray-200 p-8 flex flex-col border-l-4 border-l-[#C2A36B]"><h3 className="text-xl font-bold text-[#1A365D] mb-4 font-serif">Healthcare & Land Consulting</h3><p className="text-xs text-gray-500 mb-6 leading-relaxed">Specialized hospital projects, institutional land, residential plots and commercial land for healthcare groups, investors, diagnostic centres, nursing homes and businesses.</p><div className="grid grid-cols-2 gap-3 mb-8">{['50 BEDS', '100 BEDS', '150 BEDS', '200 BEDS', '300 BEDS', '500 BEDS', '700 BEDS'].map((item, i) => <div key={i} className="bg-white py-3 px-2 text-[10px] font-bold text-center border border-gray-100 text-[#1A365D] uppercase tracking-widest">{item}</div>)}</div><a href="#contact" className="mt-auto text-[11px] font-black uppercase text-[#C2A36B] tracking-widest text-right hover:text-[#8C7345]">Consult Now</a></motion.div>
        </div>

        <ROICalculator />
      </div>
    </section>
  );
}
