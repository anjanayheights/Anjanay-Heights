// Single Vercel entrypoint for the Hobby-plan function limit.
// Public inventory is handled inline so its customer-facing route has no
// module-loading dependency and cannot fail during consolidated cold start.

import { get, list } from '@vercel/blob';

type PublicProperty = {
  id: string;
  title: string;
  propertyType: string;
  location: string;
  price: string;
  area: string;
  bedrooms: string;
  status: string;
  description: string;
  createdAt: string;
  photos: string[];
  videoUrl: string;
};

const ITEM_PREFIX='crm/properties/item-';
const blobAuthCandidates:Record<string,string>[]=[
  ...(process.env.VERCEL_OIDC_TOKEN?[{token:process.env.VERCEL_OIDC_TOKEN}]:[]),
  ...(process.env.BLOB_READ_WRITE_TOKEN?[{token:process.env.BLOB_READ_WRITE_TOKEN}]:[]),
  {}
];

async function withBlobAuth<T>(op:(auth:Record<string,string>)=>Promise<T>):Promise<T>{
  let last:any=new Error('No Vercel Blob credentials configured.');
  for(const auth of blobAuthCandidates){
    try{return await op(auth)}catch(e){last=e;}
  }
  throw last;
}

function json(res:any,status:number,body:unknown){
  return res.status(status).setHeader('Cache-Control','no-store').setHeader('Pragma','no-cache').json(body);
}

async function readPublicProperties():Promise<PublicProperty[]>{
  const blobs:any[]=[];
  let cursor:string|undefined;
  do{
    const page=await withBlobAuth(a=>list({prefix:ITEM_PREFIX,cursor,...a}));
    blobs.push(...(page.blobs||[]));
    cursor=page.hasMore?page.cursor:undefined;
  }while(cursor);

  const out:PublicProperty[]=[];
  for(const b of blobs){
    try{
      const r=await withBlobAuth(a=>get(b.url||b.pathname,{access:'private',...a}));
      if(!r?.stream)continue;
      const p:any=JSON.parse(await new Response(r.stream).text());
      if(!p?.id)continue;
      out.push({
        id:String(p.id),
        title:String(p.title||'Property'),
        propertyType:String(p.propertyType||''),
        location:String(p.location||''),
        price:String(p.price||''),
        area:String(p.area||''),
        bedrooms:String(p.bedrooms||''),
        status:String(p.status||'Available'),
        description:String(p.description||''),
        createdAt:String(p.createdAt||''),
        photos:Array.isArray(p.photos)?p.photos.filter((x:any)=>typeof x==='string'):[],
        videoUrl:String(p.videoUrl||'')
      });
    }catch{}
  }
  return out;
}

async function crmAuth(req:any,res:any){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  const password=process.env.DASHBOARD_PASSWORD||'';
  const authorization=String(req?.headers?.authorization||'');
  if(!password||authorization!==`Bearer ${password}`)return json(res,401,{error:'Unauthorized'});
  return json(res,200,{ok:true});
}

async function publicInventory(req:any,res:any){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  try{
    const all=await readPublicProperties();
    const u=new URL(String(req.url||'/'),'http://localhost');
    const q=(u.searchParams.get('q')||'').trim().toLowerCase();
    const bhk=(u.searchParams.get('bhk')||'').match(/\d+/)?.[0]||'';
    const location=(u.searchParams.get('location')||'').trim().toLowerCase();
    const type=(u.searchParams.get('type')||'').trim().toLowerCase();
    const available=all.filter(p=>p.status.trim().toLowerCase()==='available');
    const properties=available.filter(p=>{
      const hay=`${p.title} ${p.propertyType} ${p.location} ${p.price} ${p.area} ${p.bedrooms} ${p.description}`.toLowerCase();
      const nums=String(p.bedrooms||'').match(/\d+(?:\.\d+)?/g)||[];
      return (!q||hay.includes(q))&&(!location||p.location.toLowerCase().includes(location))&&
        (!type||p.propertyType.toLowerCase().includes(type))&&(!bhk||nums.includes(bhk));
    }).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
      .map(p=>({...p,minBudget:null,maxBudget:null,marketOpportunity:/third-party|market opportunity|researched/i.test(p.description)}));
    return json(res,200,{properties,availableCount:available.length,totalCount:all.length,updatedAt:new Date().toISOString(),source:'crm-property-inventory'});
  }catch(e:any){
    return json(res,200,{properties:[],availableCount:0,totalCount:0,updatedAt:new Date().toISOString(),inventoryUnavailable:true,error:String(e?.message||'Unable to load live inventory.')});
  }
}

const loaders: Record<string, () => Promise<any>> = {
  'ai-lead-assistant': () => import('../server-api/ai-lead-assistant.js'),
  'assigned-lead-alert': () => import('../server-api/assigned-lead-alert.js'),
  'booking-control': () => import('../server-api/booking-control.js'),
  'collection-priority': () => import('../server-api/collection-priority.js'),
  'customer-ai': () => import('../server-api/customer-ai.js'),
  'customer-whatsapp': () => import('../server-api/customer-whatsapp.js'),
  'follow-up-automation': () => import('../server-api/follow-up-automation.js'),
  'follow-up-cron': () => import('../server-api/follow-up-cron.js'),
  'follow-up-push': () => import('../server-api/follow-up-push.js'),
  'followup-engine': () => import('../server-api/followup-engine.js'),
  'inventory-public': async () => ({default: publicInventory}),
  'auth': async () => ({default: crmAuth}),
  'lead-assignment': () => import('../server-api/lead-assignment.js'),
  'lead-conversion-plan': () => import('../server-api/lead-conversion-plan.js'),
  'lead-match': () => import('../server-api/lead-match.js'),
  'lead-meta': () => import('../server-api/lead-meta.js'),
  'lead-property-match': () => import('../server-api/lead-property-match.js'),
  'lead-reengagement': () => import('../server-api/lead-reengagement.js'),
  'lead-response-sla': () => import('../server-api/lead-response-sla.js'),
  'lead-routing': () => import('../server-api/lead-routing.js'),
  'lead-shortlist-send': () => import('../server-api/lead-shortlist-send.js'),
  'leads': () => import('../server-api/leads.js'),
  'meta-lead-auto-route': () => import('../server-api/meta-lead-auto-route.js'),
  'meta-lead-webhook': () => import('../server-api/meta-lead-webhook.js'),
  'payment-collections': () => import('../server-api/payment-collections.js'),
  'payment-escalation-alert': () => import('../server-api/payment-escalation-alert.js'),
  'payment-escalation': () => import('../server-api/payment-escalation.js'),
  'payment-ledger': () => import('../server-api/payment-ledger.js'),
  'payment-schedule': () => import('../server-api/payment-schedule.js'),
  'post-visit-followup': () => import('../server-api/post-visit-followup.js'),
  'priority-match-queue': () => import('../server-api/priority-match-queue.js'),
  'properties': () => import('../server-api/properties.js'),
  'property-history': () => import('../server-api/property-history.js'),
  'property-match': () => import('../server-api/property-match.js'),
  'push': () => import('../server-api/push.js'),
  'referral-request': () => import('../server-api/referral-request.js'),
  'review-request': () => import('../server-api/review-request.js'),
  'sales-priority-queue': () => import('../server-api/sales-priority-queue.js'),
  'site-visit-alert': () => import('../server-api/site-visit-alert.js'),
  'site-visit-complete': () => import('../server-api/site-visit-complete.js'),
  'site-visit-reminders': () => import('../server-api/site-visit-reminders.js'),
  'site-visit-request': () => import('../server-api/site-visit-request.js'),
  'visitor': () => import('../server-api/visitor.js'),
  'whatsapp-webhook': () => import('../server-api/whatsapp-webhook.js'),
};

function routeFromRequest(req:any){
  const explicit=req?.query?.route;
  if(explicit) return String(explicit).replace(/^\/+|\/+$/g,'');
  const raw=String(req?.url||'').split('?')[0];
  return raw.replace(/^\/api\/+/, '').replace(/\/+$/,'');
}

export default async function handler(req:any,res:any){
  const route=routeFromRequest(req);
  const load=loaders[route];
  if(!load) return res.status(404).json({error:'API route not found.',route});
  try {
    const mod=await load();
    const fn=mod?.default||mod?.handler;
    if(typeof fn!=='function') return res.status(500).json({error:'API handler is not available.',route});
    return fn(req,res);
  } catch(e:any) {
    return res.status(500).json({error:'API module failed to load.',route,message:String(e?.message||e)});
  }
}
