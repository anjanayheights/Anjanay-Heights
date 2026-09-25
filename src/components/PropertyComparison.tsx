import { useEffect, useState } from 'react';

type Property = {
  id: string;
  title: string;
  propertyType: string;
  location: string;
  price: string;
  area: string;
  bedrooms: string;
  description?: string;
  isHot?: boolean;
};

export default function PropertyComparison() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/inventory-public')
      .then((r) => r.ok ? r.json() : { properties: [] })
      .then((data) => setProperties(Array.isArray(data.properties) ? data.properties : []))
      .catch(() => setProperties([]));
  }, []);

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current);
  };

  const compared = selected.map((id) => properties.find((p) => p.id === id)).filter(Boolean) as Property[];

  return (
    <section className="py-20 bg-white border-t border-gray-200" id="compare-properties">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-l-4 border-[#C2A36B] pl-8 py-2 mb-8">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Buyer decision tool</div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] font-light">Compare Verified Properties</h2>
          <p className="mt-3 text-sm text-gray-600">Select up to 3 current verified properties and compare price, location, type, area and configuration side by side.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.slice(0, 12).map((property) => {
            const checked = selected.includes(property.id);
            return (
              <button
                key={property.id}
                type="button"
                onClick={() => toggle(property.id)}
                className={'text-left border p-5 transition ' + (checked ? 'border-[#C2A36B] bg-[#F9F9F7]' : 'border-gray-200 bg-white hover:border-[#C2A36B]/60')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#C2A36B]">Verified {property.isHot ? '• Hot' : ''}</div>
                    <h3 className="mt-1 text-lg font-serif text-[#1A365D]">{property.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{property.location}</p>
                  </div>
                  <span className={'w-5 h-5 border flex items-center justify-center text-xs ' + (checked ? 'bg-[#1A365D] text-white border-[#1A365D]' : 'border-gray-300')}>
                    {checked ? '✓' : ''}
                  </span>
                </div>
                <div className="mt-4 flex justify-between text-xs">
                  <span className="text-gray-500">{property.propertyType}</span>
                  <span className="font-bold text-[#1A365D]">{property.price || 'Contact Sales'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {compared.length > 0 && (
          <div className="mt-8 overflow-x-auto border border-gray-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-[#1A365D] text-white">
                  <th className="p-4 text-left font-medium">Compare</th>
                  {compared.map((p) => <th key={p.id} className="p-4 text-left font-medium">{p.title}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Type', (p: Property) => p.propertyType],
                  ['Location', (p: Property) => p.location],
                  ['Price', (p: Property) => p.price || 'Contact Sales'],
                  ['Configuration', (p: Property) => p.bedrooms || '—'],
                  ['Area', (p: Property) => p.area || '—'],
                ].map(([label, getter], row) => (
                  <tr key={String(label)} className={row % 2 ? 'bg-[#F9F9F7]' : 'bg-white'}>
                    <td className="p-4 font-semibold text-[#1A365D]">{String(label)}</td>
                    {compared.map((p) => <td key={p.id} className="p-4 text-gray-600">{(getter as (p: Property) => string)(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-between">
              <span className="text-xs text-gray-500">Final price and availability should be reconfirmed before purchase.</span>
              <a
                href={'https://wa.me/919289771222?text=' + encodeURIComponent('Hello Anjanay Heights, I want to compare these verified properties: ' + compared.map((p) => p.title).join(', '))}
                target="_blank"
                rel="noreferrer"
                className="bg-[#C2A36B] text-[#1A365D] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-center"
              >
                Discuss Comparison on WhatsApp
              </a>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-5">Only active, verified and public inventory is eligible for comparison.</p>
      </div>
    </section>
  );
}
