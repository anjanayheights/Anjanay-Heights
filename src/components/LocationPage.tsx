import { useEffect, useMemo, useState } from 'react';

type Property = {
  id: string; title: string; propertyType: string; location: string; price: string;
  area: string; bedrooms: string; description?: string; isHot?: boolean;
};

const AREA_CONFIG: Record<string,{name:string; intro:string; focus:string; path:string}> = {
  "noida": {name:"Noida", intro:"Explore active, verified residential and commercial property opportunities across Noida.", focus:"Noida property search by sector, property type, budget and verified availability.", path:"noida"},
  "greater-noida": {name:"Greater Noida", intro:"Explore active, verified property opportunities across Greater Noida and its major growth corridors.", focus:"Greater Noida residential, commercial and investment property search.", path:"greater-noida"},
  "noida-extension": {name:"Noida Extension", intro:"Explore active, verified residential and commercial opportunities in Noida Extension.", focus:"Noida Extension property search with current verified inventory.", path:"noida-extension"},
  "yamuna-expressway": {name:"Yamuna Expressway", intro:"Explore active, verified property opportunities along the Yamuna Expressway corridor.", focus:"Yamuna Expressway property search across current verified inventory.", path:"yamuna-expressway"},
  "yeida": {name:"YEIDA", intro:"Explore active, verified property opportunities in the YEIDA corridor.", focus:"YEIDA property search using current verified public inventory.", path:"yeida"},
  "faridabad": {name:"Faridabad", intro:"Explore active, verified residential and commercial opportunities in Faridabad.", focus:"Faridabad property search using current verified inventory.", path:"faridabad"},
  "ghaziabad": {name:"Ghaziabad", intro:"Explore active, verified residential and commercial opportunities in Ghaziabad.", focus:"Ghaziabad property search using current verified inventory.", path:"ghaziabad"},
  "gurgaon": {name:"Gurgaon", intro:"Explore active, verified property opportunities in Gurgaon.", focus:"Gurgaon property search using current verified inventory.", path:"gurgaon"},
};

export default function LocationPage({slug}:{slug:string}) {
  const config = AREA_CONFIG[slug];
  const [properties,setProperties] = useState<Property[]>([]);
  useEffect(()=>{fetch('/api/inventory-public').then(r=>r.ok?r.json():{properties:[]}).then(d=>setProperties(Array.isArray(d.properties)?d.properties:[])).catch(()=>setProperties([]));},[]);
  const matches = useMemo(()=>config ? properties.filter(p=>p.location.toLowerCase().includes(config.name.toLowerCase()) || (config.name==="Noida" && p.location.toLowerCase().includes("noida"))).slice(0,12):[],[properties,config]);
  if(!config) return <div className="min-h-screen p-10 font-sans"><h1 className="text-3xl font-serif">Location not found</h1><a href="/" className="text-[#C2A36B] mt-4 inline-block">Back to Anjanay Heights</a></div>;
  return <div className="min-h-screen bg-[#F9F9F7] text-[#1A1A1A]">
    <header className="bg-[#1A365D] text-white py-16"><div className="max-w-7xl mx-auto px-4">
      <a href="/" className="text-[10px] uppercase tracking-widest text-[#C2A36B]">← Anjanay Heights</a>
      <div className="mt-8 max-w-4xl"><div className="text-[10px] uppercase tracking-widest text-[#C2A36B] font-bold">Verified property search · NCR</div>
      <h1 className="mt-3 text-4xl md:text-5xl font-serif font-light">Property in {config.name}</h1>
      <p className="mt-5 text-white/75 max-w-2xl leading-relaxed">{config.intro}</p>
      <div className="mt-7 text-sm text-white/60">{config.focus}</div></div>
    </div></header>
    <main className="max-w-7xl mx-auto px-4 py-14">
      <div className="flex items-end justify-between gap-4 mb-8"><div><div className="text-[10px] uppercase tracking-widest text-[#C2A36B] font-bold">Live verified inventory</div><h2 className="text-3xl font-serif text-[#1A365D] mt-2">Current properties in {config.name}</h2></div><a href="/#properties" className="text-[10px] uppercase tracking-widest font-bold text-[#1A365D]">All Properties →</a></div>
      {matches.length ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{matches.map(p=><article key={p.id} className="bg-white border border-gray-200 p-5">
        <div className="text-[9px] uppercase tracking-widest text-[#C2A36B] font-bold">Verified {p.isHot?'• Hot':''}</div><h3 className="text-xl font-serif text-[#1A365D] mt-2">{p.title}</h3><p className="text-xs text-gray-500 mt-1">{p.location}</p>
        <div className="mt-4 flex justify-between text-xs"><span>{p.propertyType}</span><b className="text-[#1A365D]">{p.price||'Contact Sales'}</b></div>
        <div className="mt-5 flex gap-2"><a href={'/property/'+encodeURIComponent(p.id)} className="flex-1 text-center border border-[#C2A36B] py-2 text-[9px] font-bold uppercase tracking-widest text-[#1A365D]">Details</a><a href={'https://wa.me/919289771222?text='+encodeURIComponent('Hello Anjanay Heights, I want details for '+p.title+' in '+p.location)} target="_blank" rel="noreferrer" className="flex-1 text-center bg-[#1A365D] text-white py-2 text-[9px] font-bold uppercase tracking-widest">WhatsApp</a></div>
      </article>)}</div> : <div className="bg-white border border-gray-200 p-8"><h3 className="text-xl font-serif text-[#1A365D]">No matching public inventory right now</h3><p className="mt-2 text-sm text-gray-600">We only display active, verified and public properties. Ask us for similar verified options in {config.name}.</p><a href={'https://wa.me/919289771222?text='+encodeURIComponent('Hello Anjanay Heights, please share verified property options in '+config.name)} target="_blank" rel="noreferrer" className="inline-block mt-5 bg-[#C2A36B] text-[#1A365D] px-5 py-3 text-[10px] font-bold uppercase tracking-widest">Ask on WhatsApp</a></div>}
      <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-500">Inventory shown here is limited to active, verified and public records. Price, availability and unit-level details must be reconfirmed before purchase.</div>
    </main>
  </div>;
}