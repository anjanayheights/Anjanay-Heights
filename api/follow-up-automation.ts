import { get, list, put } from '@vercel/blob';

const META_PATH = 'crm/lead-meta.json';
const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];

function header(req: any, name: string) { const h = req?.headers; if (h?.get) return h.get(name) || ''; return h?.[name.toLowerCase()] || h?.[name] || ''; }
function send(res: any, status: number, body: unknown) { return res.status(status).setHeader('Cache-Control','no-store').json(body); }
function authorized(req: any) { const secret = process.env.CRON_SECRET || ''; return !secret || header(req,'authorization') === `Bearer ${secret}`; }
function blobAuthError(e: unknown) { return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${String((e as any)?.name||'')} ${String((e as any)?.message||'')}`); }
async function withBlobAuth<T>(fn: (auth: Record<string,string>) => Promise<T>) { let last: unknown = new Error('Blob credentials missing'); for (const auth of [{}, ...blobAuthCandidates] as Record<string,string>[]) { try { return await fn(auth); } catch(e) { last=e; if(!blobAuthError(e)) throw e; } } throw last; }
async function readJson(url: string) { const r = await withBlobAuth(a => get(url,{access:'private',useCache:false,...a})); return r?.statusCode===200 && r.stream ? await new Response(r.stream).json() : null; }
async function loadLeads() { const r=await withBlobAuth(a=>list({prefix:'leads/',...a})); const v=await Promise.all(r.blobs.map(b=>readJson(b.url).catch(()=>null))); return v.filter(Boolean); }
async function loadMeta() { const r=await withBlobAuth(a=>list({prefix:META_PATH,...a})); return r.blobs[0] ? ((await readJson(r.blobs[0].url)) || {}) : {}; }
function istDate(offset=0) { const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const y=+p.find(x=>x.type==='year')!.value,m=+p.find(x=>x.type==='month')!.value-1,d=+p.find(x=>x.type==='day')!.value; return new Date(Date.UTC(y,m,d+offset)).toISOString().slice(0,10); }
function plan(score:number, status:string, timeline:string) {
  if (status==='Site Visit') return [{day:0,action:'Confirm Site Visit',channel:'whatsapp+call'},{day:1,action:'Visit confirmation / directions',channel:'whatsapp'},{day:3,action:'Post-visit follow-up',channel:'call'},{day:7,action:'Re-engage with matching property',channel:'whatsapp'}];
  if (status==='Negotiation') return [{day:0,action:'Call for negotiation/booking',channel:'call'},{day:1,action:'Send deal summary',channel:'whatsapp'},{day:3,action:'Booking follow-up',channel:'call'},{day:7,action:'Final re-engagement',channel:'whatsapp'}];
  if (score>=75 || /immediate|today|urgent|asap/i.test(timeline)) return [{day:0,action:'Call within 15 minutes',channel:'call'},{day:1,action:'Send matched properties',channel:'whatsapp'},{day:3,action:'Shortlist follow-up',channel:'call'},{day:7,action:'Re-engage / site visit',channel:'whatsapp'}];
  return [{day:0,action:'First contact + qualify requirement',channel:'call'},{day:1,action:'Send matched properties',channel:'whatsapp'},{day:3,action:'Budget/location follow-up',channel:'call'},{day:7,action:'Re-engagement + site visit CTA',channel:'whatsapp'}];
}
export default async function handler(req:any,res:any) {
  if(req.method!=='POST' && req.method!=='GET') return send(res,405,{error:'Method not allowed'});
  if(!authorized(req)) return send(res,401,{error:'Unauthorized'});
  try {
    const [leads,meta]=await Promise.all([loadLeads(),loadMeta()]); const today=istDate(); const next={...meta}; let updated=0;
    for(const lead of leads as any[]) {
      const m=meta?.[lead.id]||{}; if(['Closed','Lost'].includes(m.status)) continue;
      const score=Number(lead.score||m.score||0); const steps=plan(score,m.status||'New',lead.timeline||m.timeline||'');
      const current=m.followUpSequence;
      if(current?.version==='v1' && Array.isArray(current.steps) && current.steps.length>=4) continue;
      const stepsWithDates=steps.map(s=>({...s,date:istDate(s.day)}));
      next[lead.id]={...m,score:m.score ?? lead.score ?? score,followUpSequence:{version:'v1',createdAt:new Date().toISOString(),steps:stepsWithDates},followUp:m.followUp||`${today}T10:00`,nextAction:m.nextAction||stepsWithDates[0].action};
      updated++;
    }
    if(updated) await withBlobAuth(a=>put(META_PATH,JSON.stringify(next),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',...a}));
    return send(res,200,{ok:true,automation:'day-0-1-3-7',date:today,leads:leads.length,updated});
  } catch(e) { console.error('follow-up-automation',e); return send(res,500,{error:'Unable to build follow-up sequence'}); }
}
