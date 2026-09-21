import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const WHATSAPP = '919289771222';

type Property = {
  id: string;
  title: string;
  propertyType: string;
  location: string;
  price: string;
  area: string;
  bedrooms: string;
  photos?: string[];
  description?: string;
  lastVerified?: string;
  verificationStatus?: string;
  isHot?: boolean;
};

function whatsappUrl(p: Property) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Hello Anjanay Heights, I am interested in ${p.title} in ${p.location}. Please confirm current availability, exact price and site visit options.`
  )}`;
}

function formatVerifiedDate(value?: string) {
  if (!value) return 'Recently verified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently verified';
  return 'Verified ' + date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function matchesType(propertyType: string, wanted: string) {
  if (wanted === 'All Types') return true;
  const value = propertyType.toLowerCase();
  const target = wanted.toLowerCase();
  if (target === 'residential') return /flat|apartment|villa|residential/.test(value);
  if (target === 'commercial') return /commercial|office|shop|retail/.test(value);
  if (target === 'plot') return /plot|land/.test(value);
  if (target === 'hospital') return /hospital|healthcare|institutional/.test(value);
  return value.includes(target);
}

function matchesPrice(priceValue: string, wanted: string) {
  if (wanted === 'All Prices') return true;
  const price = priceValue.toLowerCase();
  if (wanted === 'Under ₹1 Cr') return /lakh|lakhs/.test(price) && !price.includes('cr');
  if (wanted === '₹1 Cr – ₹3 Cr') return /1(?:\.\d+)?\s*cr|2(?:\.\d+)?\s*cr|₹1\s*cr|₹2\s*cr/.test(price);
  if (wanted === 'Above ₹3 Cr') return /3(?:\.\d+)?\s*cr|4(?:\.\d+)?\s*cr|5(?:\.\d+)?\s*cr|6(?:\.\d+)?\s*cr|10\s*cr|20\s*cr|40\s*cr|50\s*cr|55\s*cr|60\s*cr|90\s*cr|100\s*cr/.test(price);
  return true;
}

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filterType, setFilterType] = useState('All Types');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  const [filterPrice, setFilterPrice] = useState('All Prices');
  const [loading, setLoading] = useState(true);
  const [inventoryUnavailable, setInventoryUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/inventory-public')
      .then((response) => {
        if (!response.ok) throw new Error('Inventory request failed');
        return response.json();
      })
      .then((data: { properties?: Property[]; inventoryUnavailable?: boolean }) => {
        if (!active) return;
        setProperties(Array.isArray(data.properties) ? data.properties : []);
        setInventoryUnavailable(Boolean(data.inventoryUnavailable));
      })
      .catch(() => {
        if (!active) return;
        setProperties([]);
        setInventoryUnavailable(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredProperties = useMemo(() => properties.filter((property) => {
    if (!matchesType(property.propertyType, filterType)) return false;
    if (filterLocation !== 'All Locations' && !property.location.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    return matchesPrice(property.price, filterPrice);
  }), [properties, filterType, filterLocation, filterPrice]);

  return () => { cancelled = true; };
  }, []);

  const filteredProperties = useMemo(() => properties.filter((p) => {
    const type = p.propertyType.toLowerCase();
    const location = p.location.toLowerCase();

    if (filterType !== 'All Types') {
      const wanted = filterType.toLowerCase();
      const matches = wanted === 'residential'
        ? /flat|apartment|villa|residential/.test(type)
        : wanted === 'commercial'
          ? /commercial|office|shop|retail/.test(type)
          : wanted === 'plot'
            ? /plot|land/.test(type)
            : wanted === 'hospital'
              ? /hospital|healthcare/.test(type)
              : type.includes(wanted);
      if (!matches) return false;
    }

    if (filterLocation !== 'All Locations' && !location.includes(filterLocation.toLowerCase())) return false;

    if (filterPrice !== 'All Prices') {
      const price = p.price.toLowerCase();
      const hasCr = price.includes('cr');
      const lakh = /l|lakh/.test(price) && !hasCr;
      const oneToThree = /1\.|2\.|₹1 cr|₹2 cr|1 cr|2 cr/.test(price);
      const aboveThree = /3 cr|4 cr|5 cr|6 cr|10 cr|20 cr|40 cr|50 cr|55 cr|60 cr|90 cr|100 cr/.test(price);
      if (filterPrice === 'Under ₹1 Cr' && !lakh) return false;
      if (filterPrice === '₹1 Cr – ₹3 Cr' && !oneToThree) return false;
      if (filterPrice === 'Above ₹3 Cr' && !aboveThree) return false;
    }

    return true;
  }), [properties, filterType, filterLocation, filterPrice]);

  return (
    <section id="properties" className="py-20 bg-[#F9F9F7] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div className="border-l-4 border-[#C2A36B] pl-8 py-2">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Live verified inventory</div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] font-light">Properties Worth Enquiring About</h2>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">Live inventory is pulled from the Anjanay Heights property database. Only active, public and verified listings are shown.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 border border-gray-200 shadow-sm">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]">
              <option>All Types</option><option>Residential</option><option>Commercial</option><option>Plot</option><option>Hospital</option>
            </select>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]">
              <option>All Locations</option><option>Noida</option><option>Greater Noida</option><option>Noida Extension</option><option>Yamuna Expressway</option><option>YEIDA</option><option>Faridabad</option><option>Gurgaon</option><option>Ghaziabad</option>
            </select>
            <select value={filterPrice} onChange={(e) => setFilterPrice(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]">
              <option>All Prices</option><option>Under ₹1 Cr</option><option>₹1 Cr – ₹3 Cr</option><option>Above ₹3 Cr</option>
            </select>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between text-xs text-gray-500">
          <span>{loading ? 'Loading live inventory…' : `${filteredProperties.length} verified options`}</span>
          <span>{inventoryUnavailable ? 'Live inventory temporarily unavailable' : 'Prices and availability are subject to final verification'}</span>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map((i) => <div key={i} className="h-[420px] bg-white border border-gray-200 animate-pulse" />)}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white border border-gray-200 p-10 text-center">
            <h3 className="text-2xl font-serif text-[#1A365D]">No exact match found</h3>
            <p className="mt-2 text-sm text-gray-600">Try another filter or ask Anjanay Heights for similar verified properties.</p>
            <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hello Anjanay Heights, please suggest similar verified properties for my requirement.')`} target="_blank" rel="noreferrer" className="inline-block mt-5 bg-[#C2A36B] text-[#1A365D] px-6 py-3 text-[10px] font-bold uppercase tracking-widest">Ask for Similar Properties</a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProperties.map((p, i) => {
                const image = p.photos?.[0] || fallbackImage(p.propertyType);
                return (
                  <motion.div layout key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, delay: i * 0.03 }} className="group relative overflow-hidden border border-gray-200 bg-white shadow-sm">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img src={image} alt={`${p.title} in ${p.location}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-white/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#1A365D]">Verified</span>
                        {p.isHot && <span className="bg-[#C2A36B] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#1A365D]">Hot</span>}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-1">{p.propertyType}</div>
                        <h3 className="text-xl font-serif text-white">{p.title}</h3>
                        <p className="text-sm text-white/85 mt-1">{p.location}</p>
                      </div>
                      <div className="absolute inset-0 bg-[#1A365D]/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">Verified Inventory</div>
                          <h3 className="text-xl font-serif text-white mb-1">{p.title}</h3>
                          <p className="text-sm text-white/80">{p.location}</p>
                          <p className="text-xs text-white/70 mt-4">{p.description || 'Current project details available from sales.'}</p>
                        </div>
                        <div>
                          <div className="space-y-3 border-t border-white/20 pt-4 mb-5">
                            <div className="flex justify-between text-xs text-white/90"><span>Configuration</span><span className="font-medium text-right ml-4">{p.bedrooms || '—'}</span></div>
                            <div className="flex justify-between text-xs text-white/90"><span>Area</span><span className="font-medium">{p.area || '—'}</span></div>
                            <div className="flex justify-between text-xs text-white/90"><span>Price</span><span className="font-bold text-[#C2A36B] text-right ml-4">{p.price || 'Contact Sales'}</span></div>
                            <div className="text-[10px] text-white/60">{formatVerifiedDate(p.lastVerified)}</div>
                          </div>
                          <a href={whatsappUrl(p)} target="_blank" rel="noreferrer" className="block w-full text-center bg-[#C2A36B] text-[#1A365D] py-3 text-[10px] font-bold uppercase tracking-widest hover:opacity-90">Check Availability on WhatsApp</a>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-1">{p.propertyType}</div>
                      <h3 className="text-lg font-serif text-[#1A365D] mb-1 truncate">{p.title}</h3>
                      <div className="flex justify-between items-center gap-3 mt-2"><span className="text-xs text-gray-500 truncate">{p.location}</span><span className="text-xs font-bold text-[#1A365D] text-right">{p.price || 'Contact Sales'}</span></div>
                      <a href={whatsappUrl(p)} target="_blank" rel="noreferrer" className="mt-4 block w-full text-center border border-[#1A365D] text-[#1A365D] py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1A365D] hover:text-white">Ask Sales Team</a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
