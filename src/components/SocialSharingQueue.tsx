import { useMemo, useState } from 'react';

const SITE_URL = 'https://anjanayheights-9m6i.vercel.app/';
const WHATSAPP = '919289771222';

type SocialProperty = { id: string; title: string; type: string; location: string; price: string };

const properties: SocialProperty[] = [
  { id: 'market-paradise-shree-ram', title: 'Paradise Shree Ram Vatika', type: 'Villa', location: 'Noida Extension, Greater Noida', price: '₹58.5 L – ₹73.01 L' },
  { id: 'market-vihaan-wardania', title: 'Vihaan Wardania', type: 'Residential', location: 'Noida Extension, Greater Noida', price: '₹47.99 L – ₹64.99 L' },
  { id: 'market-crc-joyous', title: 'CRC Joyous', type: 'Residential', location: 'Techzone 4, Greater Noida West', price: '₹1.32 Cr – ₹2.26 Cr' },
  { id: 'market-godrej-arden', title: 'Godrej Arden', type: 'Residential', location: 'Sigma III, Greater Noida', price: '₹2.30 Cr – ₹4.40 Cr' },
  { id: 'market-nbcc-aspire', title: 'NBCC Aspire Eternia Residences', type: 'Residential', location: 'Techzone 4, Greater Noida', price: '₹1.71 Cr – ₹2.33 Cr' },
  { id: 'market-ncr-monarch', title: 'NCR Monarch', type: 'Residential', location: 'Sector 1, Greater Noida West', price: '₹85.77 Lakhs onwards*' },
  { id: 'market-godrej-majesty', title: 'Godrej Majesty', type: 'Residential', location: 'Sector 12, Greater Noida West', price: '₹3.56 Cr onwards*' },
  { id: 'market-vvip-addresses', title: 'VVIP Addresses Greater Noida West', type: 'Residential', location: 'Sector 12, Noida Extension, Greater Noida', price: '₹3.81 Cr–₹5.99 Cr' },
  { id: 'market-yeida-rps02', title: 'YEIDA RPS 02 Residential Plot', type: 'Residential Plot', location: 'Sector 17, YEIDA, Yamuna Expressway', price: '₹80 Lakhs' },
  { id: 'market-ace-yxp', title: 'ACE YXP Commercial', type: 'Commercial', location: 'Sector 22D, Yamuna Expressway, Greater Noida', price: '₹86.58 Lakhs–₹3.30 Cr*' },
  { id: 'market-hospital-gamma2-35', title: '35-Bed Multi-Specialty Hospital', type: 'Hospital', location: 'Gamma-2, Greater Noida', price: 'Contact for current asking price' },
  { id: 'market-hospital-gurgaon-106', title: '100 Beds Hospital', type: 'Hospital', location: 'Sector 106, Gurgaon', price: '₹100 Cr' },
];

function propertyUrl(id: string) { return `${SITE_URL}?property=${encodeURIComponent(id)}`; }
function postText(p: SocialProperty) { const url = propertyUrl(p.id); return `🏠 ${p.title}\n\n${p.type} • ${p.location}\nPrice: ${p.price}\n\nVerified property opportunity from Anjanay Heights. Availability and price should be reconfirmed before booking.\n\n📞 WhatsApp Sales: https://wa.me/${WHATSAPP}\n🔗 View property: ${url}\n\n#AnjanayHeights #RealEstate #PropertyForSale #GreaterNoida #Noida #NCR`; }

export default function SocialSharingQueue() {
  const [selected, setSelected] = useState(properties[0].id);
  const [copied, setCopied] = useState('');
  const current = useMemo(() => properties.find((p) => p.id === selected) || properties[0], [selected]);
  const url = propertyUrl(current.id);
  async function copy(value: string, label: string) { try { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(''), 1600); } catch { setCopied('Copy manually'); } }

  return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-3 mb-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Private CRM</p><h1 className="text-3xl font-bold text-[#1A365D] mt-1">📣 Instagram + Facebook Sharing Queue</h1><p className="text-slate-600 mt-1">Inventory property → title + URL → post-ready content. Direct Meta publishing is not enabled here.</p></div><a href="/admin" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Dashboard</a></div>
  <div className="grid lg:grid-cols-[1fr_1.3fr] gap-5"><section className="bg-white rounded-2xl shadow-sm border p-4"><div className="flex items-center justify-between mb-3"><h2 className="font-bold">Properties</h2><span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 font-semibold">Post-ready</span></div><div className="space-y-2">{properties.map((p) => <button key={p.id} onClick={() => setSelected(p.id)} className={`w-full text-left rounded-xl border p-3 ${selected === p.id ? 'border-[#1A365D] bg-slate-50' : 'border-slate-200 bg-white'}`}><p className="font-semibold text-slate-900">{p.title}</p><p className="text-xs text-slate-500 mt-1">{p.type} • {p.location}</p><p className="text-xs font-semibold text-[#1A365D] mt-1">{p.price}</p></button>)}</div></section>
  <section className="space-y-5"><div className="bg-white rounded-2xl shadow-sm border p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</p><h2 className="text-2xl font-bold text-[#1A365D] mt-1">{current.title}</h2><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void copy(current.title, 'title')} className="rounded-lg bg-[#1A365D] text-white px-4 py-2 text-sm font-semibold">Copy Title</button><button onClick={() => void copy(url, 'url')} className="rounded-lg border px-4 py-2 text-sm font-semibold">Copy URL</button>{copied && <span className="text-sm text-emerald-700 self-center">{copied === 'title' ? 'Title copied' : copied === 'url' ? 'URL copied' : copied}</span>}</div><p className="text-xs text-slate-500 break-all mt-3">{url}</p></div>
  <div className="bg-white rounded-2xl shadow-sm border p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Facebook + Instagram caption</p><textarea readOnly value={postText(current)} className="w-full min-h-64 mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6"/><button onClick={() => void copy(postText(current), 'caption')} className="mt-3 rounded-lg bg-[#1A365D] text-white px-4 py-2 text-sm font-semibold">Copy Caption</button></div>
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><b>Publishing status:</b> Content is prepared inside CRM. Facebook/Instagram direct auto-publishing still requires a supported Meta publishing connection and permissions. No password or OTP is stored here.</div></section></div></div></div>;
}
