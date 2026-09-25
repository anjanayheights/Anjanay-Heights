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
  photos?: string[];
  videoUrl?: string;
  sourceUrl?: string;
  lastVerified?: string;
  isHot?: boolean;
};

export default function PropertyDetail({ id }: { id: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inventory-public')
      .then((r) => r.ok ? r.json() : { properties: [] })
      .then((data) => {
        const match = Array.isArray(data.properties)
          ? data.properties.find((p: Property) => p.id === id)
          : null;
        setProperty(match || null);
      })
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <section className="min-h-screen bg-[#F9F9F7] px-4 py-32 text-center text-gray-500">Loading verified property…</section>;
  }

  if (!property) {
    return (
      <section className="min-h-screen bg-[#F9F9F7] px-4 py-32 text-center">
        <h1 className="text-3xl font-serif text-[#1A365D]">Property not found</h1>
        <p className="mt-3 text-sm text-gray-500">This property may no longer be active, verified or public.</p>
        <a href="/" className="inline-block mt-6 bg-[#1A365D] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest">View Verified Properties</a>
      </section>
    );
  }

  const photo = property.photos?.[0] || '';
  const whatsapp = 'https://wa.me/919289771222?text=' + encodeURIComponent(
    'Hello Anjanay Heights, I am interested in this verified property: ' + property.title + ' | ' + property.location + ' | ' + (property.price || 'Price on request')
  );

  const pageUrl = window.location.origin + '/property/' + encodeURIComponent(property.id);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: property.title + ' | Anjanay Heights',
    url: pageUrl,
    description: property.description || ('Verified property in ' + property.location + '. Contact Anjanay Heights for current availability and pricing.'),
    isPartOf: { '@type': 'WebSite', name: 'Anjanay Heights', url: window.location.origin },
    about: {
      '@type': 'Place',
      name: property.title,
      address: { '@type': 'PostalAddress', addressLocality: property.location, addressCountry: 'IN' },
      image: photo || undefined
    }
  };
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin + '/' },
      { '@type': 'ListItem', position: 2, name: 'Verified Properties', item: window.location.origin + '/#properties' },
      { '@type': 'ListItem', position: 3, name: property.title, item: pageUrl }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1A1A1A]">\n      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />\n      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
      <section className="pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <a href="/" className="text-[10px] font-bold uppercase tracking-widest text-[#1A365D]">← Back to verified properties</a>

          <div className="mt-8 grid lg:grid-cols-[1.1fr_.9fr] gap-8">
            <div className="bg-white border border-gray-200 overflow-hidden">
              {photo ? (
                <img src={photo} alt={property.title} className="w-full aspect-[16/10] object-cover" />
              ) : (
                <div className="w-full aspect-[16/10] bg-[#EEECE6] flex items-center justify-center text-sm text-gray-500">Verified property — image available on request</div>
              )}
            </div>

            <div className="bg-white border border-gray-200 p-7 md:p-9">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#EEF4F8] text-[#1A365D] text-[9px] font-bold uppercase tracking-widest">Verified</span>
                {property.isHot && <span className="px-3 py-1 bg-[#F5EBD8] text-[#8A6A2F] text-[9px] font-bold uppercase tracking-widest">Hot Property</span>}
              </div>

              <h1 className="mt-5 text-3xl md:text-4xl font-serif font-light text-[#1A365D]">{property.title}</h1>
              <p className="mt-3 text-sm text-gray-500">{property.location}</p>
              <div className="mt-6 text-2xl font-semibold text-[#1A365D]">{property.price || 'Price on request'}</div>

              <div className="grid grid-cols-2 gap-3 mt-7">
                {[
                  ['Property Type', property.propertyType || '—'],
                  ['Configuration', property.bedrooms || '—'],
                  ['Area', property.area || '—'],
                  ['Status', 'Available'],
                ].map(([label, value]) => (
                  <div key={label} className="border border-gray-200 p-4">
                    <div className="text-[9px] uppercase tracking-widest text-gray-400">{label}</div>
                    <div className="mt-1 text-sm text-[#1A365D] font-medium">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a href={whatsapp} target="_blank" rel="noreferrer" className="flex-1 bg-[#C2A36B] text-[#1A365D] px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">WhatsApp Expert</a>
                <a href="tel:+919289771222" className="flex-1 border border-[#1A365D] text-[#1A365D] px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Call +91 92897 71222</a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8">
            <article className="bg-white border border-gray-200 p-7 md:p-9">
              <div className="text-[10px] text-[#C2A36B] font-bold uppercase tracking-widest">Verified property information</div>
              <h2 className="mt-3 text-2xl font-serif text-[#1A365D]">Property Overview</h2>
              <p className="mt-5 text-sm leading-7 text-gray-600">{property.description || 'Verified inventory details are available through Anjanay Heights. Contact the sales team for current unit-level availability and final pricing.'}</p>
              <div className="mt-6 text-xs text-gray-400">Last verified: {property.lastVerified ? new Date(property.lastVerified).toLocaleDateString('en-IN') : 'Current inventory'}</div>
            </article>

            <aside className="bg-[#1A365D] text-white p-7">
              <div className="text-[10px] text-[#D9C28F] font-bold uppercase tracking-widest">Need a similar property?</div>
              <h3 className="mt-3 text-2xl font-serif font-light">Tell us your budget and preferred location.</h3>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-block mt-6 bg-[#C2A36B] text-[#1A365D] px-6 py-3 text-[10px] font-bold uppercase tracking-widest">Find Similar</a>
            </aside>
          </div>

          <p className="mt-6 text-xs text-gray-400">Only active, verified and public inventory is shown. Price, availability and unit-level details must be reconfirmed before purchase.</p>
        </div>
      </section>
    </div>
  );
}
