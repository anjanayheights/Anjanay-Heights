import { get, head, put } from '@vercel/blob';
import { createHmac } from 'node:crypto';

const PATH='crm/payment-schedules.json';
const candidates=[...(process.env.VERCEL_OIDC_TOKEN&&process.env.BLOB_STORE_ID?[{oidcToken:process.env.VERCEL_OIDC_TOKEN,storeId:process.env.BLOB_STORE_ID}]:[]),...(process.env.BLOB_READ_WRITE_TOKEN?[{token:process.env.BLOB_READ_WRITE_TOKEN}]:[])];
function h(req:any,n:string){const x=req?.headers;if(x&&typeof x.get==='function')return x.get(n)||'';return x?.[n.toLowerCase()]||x?.[n]||''}
function ok(req:any){const p=process.env.DASHBOARD_PASSWORD||'';const t=p?createHmac('sha256',p).update('anjanay-heights-crm-session').digest('hex'):'';return Boolean((p&&h(req,'authorization')===`Bearer ${p}`)||(t&&String(h(req,'cookie')).includes(`ah_crm_session=${t}`)))}
function authErr(e:any){return /access denied|credentials|unauthorized|forbidden|valid token/i.test(`${e?.name||''} ${e?.message||''}`)}
async function blob<T>(fn:(a:any)=>Promise<T>){let last:any;for(const a of [{},...candidates])try{return await fn(a)}catch(e){last=e;if(!authErr(e))throw e}throw last}
async function read(){try{const i:any=await blob(a=>head(PATH,a));const r:any=await blob(a=>get(i.url,{access:'private',useCache:false,...a}));return {data:await new Response(r.stream).json(),etag:i.etag}}catch(e:any){if(e?.status===404||/not found|BlobNotFound/i.test(`${e?.name||''} ${e?.message||''}`))return {data:{},etag:undefined};throw e}}
async function write(data:any,etag?:string){return blob(a=>put(PATH,JSON.stringify(data),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',...(etag?{ifMatch:etag}:{}),...a}))}
function clean(v:any,max=500){return String(v??'').slice(0,max)}
function datePlus(base:string,days:number){const d=new Date(`${base}T00:00:00+05:30`);if(Number.isNaN(d.getTime()))return '';d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function state(due:string,paid:string){if(paid)return 'PAID';if(!due)return 'NO DATE';const d=new Date(`${due}T00:00:00+05:30`).getTime();const n=Date.now();const days=Math.ceil((d-n)/86400000);if(days<0)return `OVERDUE ${Math.abs(days)}D`;if(days===0)return 'DUE TODAY';if(days<=7)return `DUE ${days}D`;return 'UPCOMING'}
function makeSchedule(b:any){
 const leadId=clean(b.leadId,120), total=Math.max(0,Number(b.dealValue||b.totalAmount||0));
 const bookingDate=clean(b.bookingDate||new Date().toISOString().slice(0,10),30);
 const pct=(x:number)=>Math.round(total*x/100);
 const custom=Array.isArray(b.milestones)?b.milestones.map((m:any,i:number)=>({id:`M${i+1}`,name:clean(m.name||`Milestone ${i+1}`,100),percentage:Math.max(0,Number(m.percentage||0)),amount:Math.max(0,Number(m.amount||0)),dueDate:clean(m.dueDate,30),note:clean(m.note,500)})):[];
 const milestones=custom.length?custom:[
  {id:'M1',name:'Booking / Token',percentage:10,amount:pct(10),dueDate:bookingDate,note:'Booking amount / token'},
  {id:'M2',name:'Agreement / First Demand',percentage:20,amount:pct(20),dueDate:datePlus(bookingDate,15),note:'Agreement and first demand'},
  {id:'M3',name:'Construction / Milestone Payment',percentage:30,amount:pct(30),dueDate:datePlus(bookingDate,60),note:'Project milestone; verify builder demand schedule'},
  {id:'M4',name:'Pre-Possession / Final Demand',percentage:30,amount:pct(30),dueDate:datePlus(bookingDate,120),note:'Final demand before possession'},
  {id:'M5',name:'Possession / Handover',percentage:10,amount:pct(10),dueDate:datePlus(bookingDate,150),note:'Possession and handover'}
 ];
 return {leadId,totalAmount:total,currency:'INR',bookingDate,milestones:milestones.map((m:any)=>({...m,percentage:Number(m.percentage||0),amount:Math.max(0,Number(m.amount||0)),state:state(m.dueDate,clean(m.paidDate,30))})),updatedAt:new Date().toISOString(),source:'ANJANAY_HEIGHTS'};
}
export default async function handler(req:any,res:any){if(!ok(req))return res.status(401).json({error:'Unauthorized'});try{
 if(req.method==='GET'){const s=await read();const leadId=clean(req.query?.leadId,120);if(leadId)return res.status(200).setHeader('Cache-Control','no-store').json({schedule:(s.data||{})[leadId]||null});return res.status(200).setHeader('Cache-Control','no-store').json({schedules:Object.values((s.data||{}) as Record<string,any>)});}
 if(req.method==='POST'){const b=req.body&&typeof req.body==='object'?req.body:{};if(!clean(b.leadId,120))return res.status(400).json({error:'leadId is required'});const schedule=makeSchedule(b);for(let attempt=0;attempt<3;attempt++){const s=await read();const all:Record<string,any>=s.data||{};all[schedule.leadId]=schedule;try{await write(all,s.etag);return res.status(200).json({ok:true,schedule})}catch(e:any){if(!/precondition|etag/i.test(String(e?.message||''))||attempt===2)throw e}}}
 return res.status(405).json({error:'Method not allowed'});
}catch(e){console.error('payment-schedule error',e);return res.status(500).json({error:'Unable to access payment schedule storage.'})}}
