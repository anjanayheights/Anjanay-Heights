import { useEffect, useMemo, useState } from 'react';

type Lead={id:string;name:string;phone:string;location?:string;budget?:string;timeline?:string;requirement?:string;created_at:string};
type HistoryItem={id:string;action:string;at:string;note?:string};
type Meta={status?:string;priority?:string;nextAction?:string;followUp?:string;history?:HistoryItem[]};
const CRM_SESSION_KEY='anjanay-heights-crm-password';
const istDate=(offsetDays=0)=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const y=Number(parts.find(p=>p.type==='year')?.value);const m=Number(parts.find(p=>p.type==='month')?.value)-1;const d=Number(parts.find(p=>p.type==='day')?.value);const date=new Date(Date.UTC(y,m,d+offsetDays));return date.toISOString().slice(0,10)};
const today=()=>istDate();
const addDays=(days:number)=>istDate(days);
const stamp=()=>new Date().toISOString();

export default function FollowupAutomation(){
 const[password,setPassword]=useState(()=>sessionStorage.getItem(CRM_SESSION_KEY)||'');
 const[loggedIn,setLoggedIn]=useState(false);
 const[leads,setLeads]=useState<Lead[]>([]);
 const[meta,setMeta]=useState<Record<string,Meta>>({});
 const[loading,setLoading]=useState(false);
 const[saving,setSaving]=useState('');
 const[error,setError]=useState('');
 const[nextDays,setNextDays]=useState(3);

 async function loadWithPassword(token:string){
  setLoading(true);setError('');
  try{
   const h={Authorization:`Bearer ${token}`,'Cache-Control':'no-cache'};const q=`?_refresh=${Date.now()}`;
   const [lr,mr]=await Promise.all([fetch(`/api/leads${q}`,{headers:h,cache:'no-store'}),fetch(`/api/lead-meta${q}`,{headers:h,cache:'no-store'})]);
   const ld=await lr.json();const md=mr.ok?await mr.json():{meta:{}};
   if(!lr.ok) throw new Error(ld.error||'Unable to load leads');
   setLeads(ld.leads||[]);setMeta(md.meta||{});setLoggedIn(true);sessionStorage.setItem(CRM_SESSION_KEY,token);
  }catch(e){sessionStorage.removeItem(CRM_SESSION_KEY);setLoggedIn(false);setError(e instanceof Error?e.message:'Unable to load follow-ups');}
  finally{setLoading(false);}
 }
 async function load(){const token=password.trim();if(!token){setError('Enter CRM password.');return}await loadWithPassword(token)}
 useEffect(()=>{const stored=sessionStorage.getItem(CRM_SESSION_KEY)||'';if(!stored)return;fetch('/api/leads?_session=1',{headers:{Authorization:`Bearer ${stored}`,'Cache-Control':'no-cache'},cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Session expired');setPassword(stored);setLoggedIn(true);return loadWithPassword(stored)}).catch(()=>{sessionStorage.removeItem(CRM_SESSION_KEY);setLoggedIn(false)});},[]);

 async function completeFollowup(id:string,days:number){
  const current=meta[id]||{};const next=addDays(days);const event={id:`followup-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,action:`Follow-up completed · next follow-up ${next}`,at:stamp(),note:`Follow-up completed; next follow-up scheduled for ${next}.`};
  const history=[...(current.history||[]),event].slice(-30);const updated={...current,priority:current.priority||'Hot',nextAction:'Follow-up',followUp:next,history};const previous=meta[id];
  setSaving(id);setError('');setMeta(x=>({...x,[id]:updated}));
  try{const r=await fetch('/api/lead-meta',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${password}`},body:JSON.stringify({leadId:id,meta:{priority:current.priority||'Hot',nextAction:'Follow-up',followUp:next},activity:event})});if(!r.ok){const body=await r.json().catch(()=>({}));throw new Error(body.error||'Could not save follow-up automation');}}
  catch(e){setMeta(x=>({...x,[id]:previous||{}}));setError(e instanceof Error?e.message:'Could not save follow-up automation');}
  finally{setSaving('');}
 }
 const active=useMemo(()=>leads.filter(l=>!['Closed','Lost'].includes(meta[l.id]?.status||'')),[leads,meta]);
 const due=useMemo(()=>{const t=today();return active.filter(l=>{const f=meta[l.id]?.followUp;return !f||f<=t}).sort((a,b)=>(meta[a.id]?.followUp||'').localeCompare(meta[b.id]?.followUp||''));},[active,meta]);
 const scheduled=active.filter(l=>{const f=meta[l.id]?.followUp;return f&&f>today()});
 if(!loggedIn)return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4"><form onSubmit={e=>{e.preventDefault();void load()}} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Follow-up Automation</h1><p className="text-gray-500 text-center mt-2">Complete a follow-up and automatically schedule the next one.</p><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Dashboard password" className="w-full border rounded-xl px-4 py-3 mt-7"/>{error&&<p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-4 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading?'Loading...':'Open Automation'}</button></form></div>;
 return <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8"><div className="max-w-6xl mx-auto"><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7"><div><a href="/admin" className="text-sm font-semibold text-[#1A365D]">← CRM Dashboard</a><h1 className="text-3xl font-bold text-[#1A365D] mt-2">⚡ Follow-up Automation</h1><p className="text-gray-500 mt-1">No completed follow-up should disappear without a next action.</p></div><button onClick={()=>void load()} disabled={loading} className="bg-[#1A365D] text-white px-5 py-3 rounded-xl font-semibold">{loading?'Refreshing...':'↻ Refresh'}</button></div>{error&&<div className="bg-red-50 text-red-700 rounded-xl p-3 mb-5">{error}</div>}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"><div className="bg-white rounded-2xl p-5 shadow"><p className="text-gray-500 text-sm">Due / Missing</p><p className="text-3xl font-bold text-[#1A365D]">{due.length}</p></div><div className="bg-white rounded-2xl p-5 shadow"><p className="text-gray-500 text-sm">Already Scheduled</p><p className="text-3xl font-bold text-[#1A365D]">{scheduled.length}</p></div><div className="bg-white rounded-2xl p-5 shadow"><p className="text-gray-500 text-sm">Active Leads</p><p className="text-3xl font-bold text-[#1A365D]">{active.length}</p></div></div>
 <div className="bg-white rounded-2xl shadow p-5"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><h2 className="text-xl font-bold text-[#1A365D]">Complete → Schedule Next</h2><p className="text-sm text-gray-500 mt-1">Select the default gap, then complete each follow-up. The activity is saved in the lead history.</p></div><div className="flex items-center gap-2"><label className="text-sm font-semibold">Next:</label><select value={nextDays} onChange={e=>setNextDays(Number(e.target.value))} className="border rounded-lg px-3 py-2"><option value={1}>Tomorrow</option><option value={3}>3 days</option><option value={7}>7 days</option><option value={14}>14 days</option></select></div></div>
 <div className="mt-5 space-y-3">{due.length===0?<p className="text-gray-500 py-8 text-center">All active leads have a future follow-up scheduled. 🎯</p>:due.map(lead=>{const m=meta[lead.id]||{};return <div key={lead.id} className="border rounded-xl p-4"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><div className="flex flex-wrap gap-2 items-center"><strong className="text-lg">{lead.name||'Unnamed lead'}</strong><span className="text-xs rounded-full bg-gray-100 px-2 py-1">{m.status||'New'}</span></div><p className="text-sm text-gray-600 mt-1">{lead.phone} · {lead.location||'Location not specified'} · {lead.budget||'Budget not specified'}</p><p className="text-xs text-gray-500 mt-1">Current follow-up: {m.followUp||'Not set'} · Next action: {m.nextAction||'Call'}</p></div><div className="flex flex-wrap gap-2"><a href={lead.phone?`tel:${lead.phone}`:'#'} className="border rounded-lg px-3 py-2 text-sm font-semibold text-[#1A365D]">📞 Call</a>{lead.phone&&<a href={`https://wa.me/${lead.phone.replace(/\D/g,'').replace(/^0(\d{10})$/,'91$1')}`} target="_blank" rel="noreferrer" className="border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg px-3 py-2 text-sm font-semibold">💬 WhatsApp</a>}<button disabled={saving===lead.id} onClick={()=>void completeFollowup(lead.id,nextDays)} className="bg-[#1A365D] text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50">{saving===lead.id?'Saving...':`✓ Complete · Next in ${nextDays}d`}</button></div></div></div>})}</div></div>
 <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-6"><h3 className="font-bold text-[#1A365D]">Automation rule</h3><p className="text-sm text-gray-700 mt-1">When a follow-up is completed, the CRM records the completion timestamp, preserves the lead history, and sets the next follow-up date automatically. Closed and Lost leads are excluded.</p></div>
 </div></div>;
}