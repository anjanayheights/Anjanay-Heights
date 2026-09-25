import { useEffect, useState } from 'react';
import { Eye, RefreshCw, Users, BarChart3 } from 'lucide-react';

const REFRESH_MS = 15_000;

export default function WebsiteViewerCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try { const r=await fetch('/api/visitor',{cache:'no-store'}); if(!r.ok) throw new Error(); setData(await r.json()); }
    catch { setData(null); } finally { setLoading(false); }
  }
  useEffect(()=>{void load();const t=window.setInterval(()=>void load(),REFRESH_MS);return()=>window.clearInterval(t)},[]);
  return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-3 text-[#1A365D]"><Eye size={22}/></div><div><p className="text-sm font-medium text-slate-500">Website Visitors</p><p className="text-3xl font-bold text-[#1A365D]">{loading?'…':data===null?'—':Number(data.totalViewers||0).toLocaleString('en-IN')}</p><p className="text-xs text-slate-400 mt-1">Unique visitors · 1-year browser cookie</p></div></div>
        <div className="flex items-center gap-3"><div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"><div className="flex items-center gap-2 text-emerald-700"><Users size={17}/><span className="text-xs font-semibold uppercase tracking-wide">Live now</span></div><p className="text-2xl font-bold text-emerald-800 mt-1">{loading?'…':data===null?'—':Number(data.activeVisitors||0).toLocaleString('en-IN')}</p></div><div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"><div className="flex items-center gap-2 text-blue-700"><BarChart3 size={17}/><span className="text-xs font-semibold uppercase tracking-wide">Today</span></div><p className="text-2xl font-bold text-blue-800 mt-1">{loading?'…':data===null?'—':Number(data.todayVisitors||0).toLocaleString('en-IN')}</p></div><button onClick={()=>void load()} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Refresh visitor count"><RefreshCw size={17} className={loading?'animate-spin':''}/></button></div>
      </div>
      {data && <div className="mt-5 grid md:grid-cols-2 gap-4"><div className="rounded-xl border p-4"><p className="text-sm font-semibold text-slate-700 mb-2">Top Pages</p>{(data.topPages||[]).length?(data.topPages||[]).map((x:any)=><div key={x.path} className="flex justify-between text-sm py-1"><span className="truncate pr-3 text-slate-600">{x.path}</span><span className="font-semibold text-[#1A365D]">{x.views}</span></div>):<p className="text-xs text-slate-400">No page views yet.</p>}</div><div className="rounded-xl border p-4"><p className="text-sm font-semibold text-slate-700 mb-2">Top Properties</p>{(data.topProperties||[]).length?(data.topProperties||[]).map((x:any)=><div key={x.id} className="flex justify-between text-sm py-1"><span className="truncate pr-3 text-slate-600">{x.name}</span><span className="font-semibold text-[#1A365D]">{x.views}</span></div>):<p className="text-xs text-slate-400">No property-page views yet.</p>}</div></div>}
    </div>
  </section>;
}