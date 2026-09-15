import { get, head, list, put } from '@vercel/blob';
import { createHash, createHmac } from 'node:crypto';

const auths = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];
const send=(res:any,status:number,body:unknown)=>res.status(status).setHeader('Cache-Control','no-store').json(body);
const header=(req:any,n:string)=>req?.headers?.get?n&&req.headers.get(n)||'':req?.headers?.[n.toLowerCase()]||'';
const authorized=(req:any)=>Boolean(process.env.DASHBOARD_PASSWORD&&header(req,'authorization')===`Bearer ${process.env.DASHBOARD_PASSWORD}`);
async function blob<T>(fn:(a:any)=>Promise<T>){let last:any;for(const a of [{},...auths])try{return await fn(a)}catch(e){last=e}throw last}
async function read(url:string){const r:any=await blob(a=>get(url,{access:'private',...a}));return r?.stream?await new Response(r.stream).json():null}
async function collection(path:string){try{const h:any=await blob(a=>head(path,a));return h?.url?await read(h.url):{}}catch{return {}}}
function phone(v:string){const d=String(v||'').replace(/\D/g,'');return d.length===10?`91${d}`:d}
function session(req:any){const p=process.env.DASHBOARD_PASSWORD||'';if(!p)return false;const expected=createHmac('sha256',p).update('anjanay-heights-crm-session').digest('hex');const raw=String(header(req,'cookie')||'');return raw.split(';').some((x:string)=>x.trim()===`ah_crm_session=${expected}`)}
function ok(req:any){return authorized(req)||session(req)}
async function sendWhatsApp(to:string,text:string){const token=process.env.WHATSAPP_ACCESS_TOKEN||'';const id=process.env.WHATSAPP_PHONE_NUMBER_ID||'';if(!token||!id||!to)return {sent:false,reason:'WhatsApp credentials or recipient missing'};const version=process.env.WHATSAPP_GRAPH_VERSION||'v23.0';const r=await fetch(`https://graph.facebook.com/${version}/${id}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{preview_url:false,body:text}})});if(!r.ok)return {sent:false,reason:await r.text()};return {sent:true}}
function intent(l:any){const t=[l.lead_type,l.requirement,l.message,l.property_type].join(' ').toLowerCase();if(/sell|seller|selling|resale/.test(t))return'SELL';if(/invest|roi|return/.test(t))return'INVEST';return'BUY'}

export async function sendAssignedLeadAlert(lead:any, assignment:any={}){
  const meta=await collection('crm/lead-meta.json');
  const agentsRaw=await collection('crm/sales-agents.json');
  const agents=Array.isArray(agentsRaw)?agentsRaw:Array.isArray(agentsRaw?.agents)?agentsRaw.agents:[];
  const assignedName=String(meta[lead.id]?.assignedSalesperson||meta[lead.id]?.assignedAgent||assignment.assignedSalesperson||'');
  const agent=agents.find((a:any)=>String(a.name||'').toLowerCase()===assignedName.toLowerCase())||null;
  const recipient=phone(agent?.phone||assignment.assignedPhone||'');
  const text=`🔔 ANJANAY HEIGHTS — New Lead\n\n${lead.name||'Customer'} wants ${intent(lead)} assistance.\n📞 ${lead.phone||'-'}\n📍 ${lead.location||'N/A'}\n🏠 ${lead.property_type||'Property'}\n💰 ${lead.budget||'Budget not provided'}\n⏱ ${lead.timeline||'Timeline not provided'}\n\nLead ID: ${lead.id}\nAction: Call the customer now and update CRM.`;
  const result=await sendWhatsApp(recipient,text);
  const now=new Date().toISOString();
  meta[lead.id]={...(meta[lead.id]||{}),assignmentAlertAt:now,assignmentAlertStatus:result.sent?'SENT':'FAILED'};
  await blob(a=>put('crm/lead-meta.json',JSON.stringify(meta),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',...a}));
  return {assignedSalesperson:agent?.name||assignedName||null,whatsapp:result};
}

export default async function handler(req:any,res:any){
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!ok(req))return send(res,401,{error:'Unauthorized'});
  try{
    const b=req.body&&typeof req.body==='object'?req.body:JSON.parse(String(req.body||'{}'));
    const leadId=String(b.leadId||'');
    if(!leadId)return send(res,400,{error:'leadId is required'});
    const leadsResult:any=await blob(a=>list({prefix:'leads/',...a}));
    let lead:any=null;
    for(const x of leadsResult.blobs){try{const candidate=await read(x.url);if(candidate?.id===leadId){lead=candidate;break}}catch{}}
    if(!lead)return send(res,404,{error:'Lead not found'});
    const result=await sendAssignedLeadAlert(lead,{assignedSalesperson:b.assignedSalesperson,assignedPhone:b.assignedPhone});
    return send(res,200,{ok:true,leadId,...result});
  }catch(e){console.error('assigned lead alert error',e);return send(res,500,{error:'Unable to send assigned lead alert.'})}
}