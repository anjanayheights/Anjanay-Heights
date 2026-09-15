import { get, list, put } from '@vercel/blob';
import { notifyFollowUpReminder } from './follow-up-push';

const auths = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];
async function blob<T>(fn:(a:any)=>Promise<T>){let last:any;for(const a of [{},...auths])try{return await fn(a)}catch(e){last=e}throw last}
async function read(url:string){const r:any=await blob(a=>get(url,{access:'private',useCache:false,...a}));return r?.stream?await new Response(r.stream).json():null}
async function load(prefix:string){const r:any=await blob(a=>list({prefix,...a}));return Promise.all(r.blobs.map(async(b:any)=>{try{return await read(b.url)}catch{return null}})).then(x=>x.filter(Boolean))}
function auth(req:any){const secret=process.env.CRON_SECRET||'';if(!secret)return true;const h=req.headers?.authorization||req.headers?.get?.('authorization')||'';return h===`Bearer ${secret}`}
function siteVisitAt(item:any){
  const sv=item?.siteVisit||{};
  if(sv.scheduledAt){const d=new Date(sv.scheduledAt);if(!Number.isNaN(d.getTime()))return d;}
  if(sv.date&&sv.time){const d=new Date(`${sv.date}T${sv.time}:00+05:30`);if(!Number.isNaN(d.getTime()))return d;}
  return null;
}
export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!auth(req))return res.status(401).json({error:'Unauthorized'});
  try{
    const [leads,meta]=await Promise.all([load('leads/'),(async()=>{const r:any=await blob(a=>list({prefix:'crm/lead-meta.json',...a}));return r.blobs?.[0]?await read(r.blobs[0].url)||{}:{};})()]);
    const now=Date.now(); const changed={...meta}; let t24=0,t2=0,missed=0;
    for(const lead of leads){
      const m=meta?.[lead.id]||{}; const sv=m.siteVisit||{}; const when=siteVisitAt(m); if(!when||sv.status!=='Scheduled')continue;
      if(['Done','Completed','Cancelled'].includes(String(sv.status)))continue;
      const diff=(when.getTime()-now)/3600000;
      const next={...sv}; let changedItem=false;
      if(diff>=22&&diff<=26&&!sv.reminder24hSentAt){
        const result=await notifyFollowUpReminder({id:lead.id,name:lead.name,phone:lead.phone,priority:m.priority,nextAction:'Confirm Site Visit (T-24h)',followUp:sv.date,siteVisit:true,reminderType:'T-24H'});
        next.reminder24hSentAt=new Date().toISOString(); next.reminder24hPushSent=Number(result?.sent||0)>0; changedItem=true; t24++;
      }
      if(diff>=1&&diff<=3&&!sv.reminder2hSentAt){
        const result=await notifyFollowUpReminder({id:lead.id,name:lead.name,phone:lead.phone,priority:m.priority,nextAction:'Confirm Site Visit (T-2h)',followUp:sv.date,siteVisit:true,reminderType:'T-2H'});
        next.reminder2hSentAt=new Date().toISOString(); next.reminder2hPushSent=Number(result?.sent||0)>0; changedItem=true; t2++;
      }
      if(diff<0&&!sv.missedAlertAt){
        const result=await notifyFollowUpReminder({id:lead.id,name:lead.name,phone:lead.phone,priority:m.priority,nextAction:'Site Visit Missed — Contact Customer',followUp:sv.date,siteVisit:true,reminderType:'MISSED'});
        next.missedAlertAt=new Date().toISOString(); next.missedPushSent=Number(result?.sent||0)>0; changedItem=true; missed++;
      }
      if(changedItem)changed[lead.id]={...m,siteVisit:next};
    }
    if(t24||t2||missed)await blob(a=>put('crm/lead-meta.json',JSON.stringify(changed),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',...a}));
    return res.status(200).json({ok:true,t24,t2,missed,checked:leads.length,generatedAt:new Date().toISOString()});
  }catch(e){console.error('site-visit-reminders error',e);return res.status(500).json({error:'Unable to process site visit reminders'});}
}
