import leadsHandler from '../server-api/leads';
import leadMetaHandler from '../server-api/lead-meta';

// Single Vercel entrypoint for the Hobby-plan function limit.
// Public inventory is handled inline so its customer-facing route has no
// module-loading dependency and cannot fail during consolidated cold start.

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

const SUPABASE_URL='https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable__2iHvDMRRfVzkPYAQfQI6Q_7Df0v2UF';

function json(res:any,status:number,body:unknown){
  return res.status(status).setHeader('Cache-Control','no-store').setHeader('Pragma','no-cache').json(body);
}

async function publicInventory(req:any,res:any){
  if(req.method!=='GET') return json(res,405,{error:'Method not allowed'});
  try {
    const endpoint=`${SUPABASE_URL}/rest/v1/public_property_catalog?select=id,name,location,property_type,status,price,area,configuration,video_url,photos_url,verification_notes,created_at,updated_at`;
    const r=await fetch(endpoint,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${SUPABASE_PUBLISHABLE_KEY}`}});
    if(!r.ok) throw new Error(`Supabase inventory unavailable (${r.status})`);
    const rows:any[]=await r.json();
    const all:PublicProperty[]=rows.map((p:any)=>({
      id:String(p?.id||''), title:String(p?.name||'Property'), propertyType:String(p?.property_type||''),
      location:String(p?.location||''), price:String(p?.price||''), area:String(p?.area||''),
      bedrooms:String(p?.configuration||''), status:String(p?.status||'Available'),
      description:String(p?.verification_notes||''), createdAt:String(p?.created_at||p?.updated_at||''),
      photos:p?.photos_url?[String(p.photos_url)]:[], videoUrl:String(p?.video_url||'')
    })).filter(p=>p.id);
    const u=new URL(String(req.url||'/'), 'http://localhost');
    const q=(u.searchParams.get('q')||'').trim().toLowerCase();
    const bhk=(u.searchParams.get('bhk')||'').match(/\d+/)?.[0]||'';
    const location=(u.searchParams.get('location')||'').trim().toLowerCase();
    const type=(u.searchParams.get('type')||'').trim().toLowerCase();
    const available=all.filter(p=>['available','active'].includes(p.status.trim().toLowerCase()));
    const properties=available.filter(p=>{
      const hay=`${p.title} ${p.propertyType} ${p.location} ${p.price} ${p.area} ${p.bedrooms} ${p.description}`.toLowerCase();
      const nums=String(p.bedrooms||'').match(/\d+(?:\.\d+)?/g)||[];
      return (!q||hay.includes(q)) && (!location||p.location.toLowerCase().includes(location)) &&
        (!type||p.propertyType.toLowerCase().includes(type)) && (!bhk||nums.includes(bhk));
    }).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
      .map(p=>({...p,minBudget:null,maxBudget:null,marketOpportunity:/third-party|market opportunity|researched/i.test(p.description)}));
    return json(res,200,{properties,availableCount:available.length,totalCount:all.length,updatedAt:new Date().toISOString()});
  } catch(e:any) {
    return json(res,200,{properties:[],availableCount:0,totalCount:0,updatedAt:new Date().toISOString(),inventoryUnavailable:true,error:String(e?.message||'Unable to load live inventory.')});
  }
}

const loaders: Record<string, () => Promise<any>> = {
  'ai-lead-assistant': () => import('../server-api/ai-lead-assistant.js.js'),
  'assigned-lead-alert': () => import('../server-api/assigned-lead-alert.js.js'),
  'booking-control': () => import('../server-api/booking-control.js.js'),
  'collection-priority': () => import('../server-api/collection-priority.js.js'),
  'customer-ai': () => import('../server-api/customer-ai.js.js'),
  'customer-whatsapp': () => import('../server-api/customer-whatsapp.js.js'),
  'follow-up-automation': () => import('../server-api/follow-up-automation.js.js'),
  'follow-up-cron': () => import('../server-api/follow-up-cron.js.js'),
  'follow-up-push': () => import('../server-api/follow-up-push.js.js'),
  'followup-engine': () => import('../server-api/followup-engine.js.js'),
  'inventory-public': async () => ({default: publicInventory}),
  'lead-assignment': () => import('../server-api/lead-assignment.js.js'),
  'lead-conversion-plan': () => import('../server-api/lead-conversion-plan.js.js'),
  'lead-match': () => import('../server-api/lead-match.js.js'),
  'lead-meta': async () => ({default: leadMetaHandler}),
  'lead-property-match': () => import('../server-api/lead-property-match.js.js'),
  'lead-reengagement': () => import('../server-api/lead-reengagement.js.js'),
  'lead-response-sla': () => import('../server-api/lead-response-sla.js.js'),
  'lead-routing': () => import('../server-api/lead-routing.js.js'),
  'lead-shortlist-send': () => import('../server-api/lead-shortlist-send.js.js'),
  'leads': async () => ({default: leadsHandler}),
  'meta-lead-auto-route': () => import('../server-api/meta-lead-auto-route.js.js'),
  'meta-lead-webhook': () => import('../server-api/meta-lead-webhook.js.js'),
  'payment-collections': () => import('../server-api/payment-collections.js.js'),
  'payment-escalation-alert': () => import('../server-api/payment-escalation-alert.js.js'),
  'payment-escalation': () => import('../server-api/payment-escalation.js.js'),
  'payment-ledger': () => import('../server-api/payment-ledger.js.js'),
  'payment-schedule': () => import('../server-api/payment-schedule.js.js'),
  'post-visit-followup': () => import('../server-api/post-visit-followup.js.js'),
  'priority-match-queue': () => import('../server-api/priority-match-queue.js.js'),
  'properties': () => import('../server-api/properties.js.js'),
  'property-history': () => import('../server-api/property-history.js.js'),
  'property-match': () => import('../server-api/property-match.js.js'),
  'push': () => import('../server-api/push.js.js'),
  'referral-request': () => import('../server-api/referral-request.js.js'),
  'review-request': () => import('../server-api/review-request.js.js'),
  'sales-priority-queue': () => import('../server-api/sales-priority-queue.js.js'),
  'site-visit-alert': () => import('../server-api/site-visit-alert.js.js'),
  'site-visit-complete': () => import('../server-api/site-visit-complete.js.js'),
  'site-visit-reminders': () => import('../server-api/site-visit-reminders.js.js'),
  'site-visit-request': () => import('../server-api/site-visit-request.js.js'),
  'visitor': () => import('../server-api/visitor.js.js'),
  'whatsapp-webhook': () => import('../server-api/whatsapp-webhook.js.js'),
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
