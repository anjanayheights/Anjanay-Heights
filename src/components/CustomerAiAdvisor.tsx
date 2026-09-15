import { useState } from 'react';
import { MessageCircle, Sparkles, X } from 'lucide-react';

const WA='https://wa.me/919289771222';
const starter=['2 BHK in Noida under my budget','Best investment option','I want a site visit'];

export default function CustomerAiAdvisor(){
 const [open,setOpen]=useState(false),[q,setQ]=useState(''),[answer,setAnswer]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('');
 async function ask(value=q){const question=value.trim();if(!question||loading)return;setQ(question);setLoading(true);setError('');setAnswer('');try{const r=await fetch('/api/customer-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question})});const x=await r.json();if(!r.ok)throw new Error(x.error||'Unable to answer');setAnswer(x.text||'');}catch(e){setError(e instanceof Error?e.message:'Please try again.')}finally{setLoading(false)}}
 return <>
  <button onClick={()=>setOpen(true)} aria-label="Ask AI Property Advisor" className="fixed bottom-24 right-5 z-50 flex items-center gap-2 rounded-full bg-[#1A365D] text-white px-4 py-3 shadow-2xl hover:scale-105 transition-transform"><Sparkles size={18}/><span className="text-sm font-bold">AI Property Advisor</span></button>
  {open&&<div className="fixed inset-0 z-[60] bg-black/30 p-4 flex items-end md:items-center justify-center" onClick={()=>setOpen(false)}>
   <div onClick={e=>e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
    <div className="bg-[#1A365D] text-white p-5 flex justify-between items-start"><div><p className="text-xs uppercase tracking-widest text-[#C2A36B] font-bold">ANJANAY HEIGHTS</p><h2 className="text-xl font-bold mt-1">AI Property Advisor</h2><p className="text-xs text-white/70 mt-1">Answers from live available inventory only</p></div><button onClick={()=>setOpen(false)}><X/></button></div>
    <div className="p-4 space-y-3"><div className="flex flex-wrap gap-2">{starter.map(s=><button key={s} onClick={()=>void ask(s)} className="text-xs border rounded-full px-3 py-2 text-[#1A365D] hover:bg-slate-50">{s}</button>)}</div>
    {answer&&<div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{answer}</div>}{error&&<div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
    <textarea value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void ask()}}} rows={3} placeholder="Tell me location, BHK, budget or investment goal…" className="w-full border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"/>
    <div className="grid grid-cols-2 gap-2"><button disabled={loading} onClick={()=>void ask()} className="rounded-xl bg-[#1A365D] text-white py-3 font-bold disabled:opacity-50">{loading?'Thinking…':'Ask Advisor'}</button><a href={WA} target="_blank" rel="noreferrer" className="rounded-xl border py-3 font-bold text-center text-[#1A365D]">WhatsApp Sales</a></div>
    <p className="text-[11px] text-gray-400">AI does not confirm availability, pricing or legal facts beyond the live inventory. Consultant confirmation is required.</p></div>
   </div></div>}
 </>
}
