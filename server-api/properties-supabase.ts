import { createHmac } from 'node:crypto';

const URL='https://xctxqausjucirnxmmjrp.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';
const key=()=>process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY||KEY;
const h=(extra:any={})=>({apikey:key(),Authorization:'Bearer '+key(),'Content-Type':'application/json',...extra});
const out=(r:any,s:number,b:any)=>r.status(s).setHeader('Cache-Control','no-store').json(b);
const head=(q:any,n:string)=>String(q?.headers?.[n.toLowerCase()]??q?.headers?.[n]??'');
const cookie=(q:any,n:string)=>{const x=head(q,'cookie').split(';').map((v:string)=>v.trim()).find((v:string)=>v.startsWith(n+'='));return x?decodeURIComponent(x.slice(n.length+1)):''};
const token=()=>{const p=process.env.DASHBOARD_PASSWORD||'';return p?createHmac('sha256',p).update('anjanay-heights-crm-session').digest('hex'):''};
const ok=(q:any)=>{const p=process.env.DASHBOARD_PASSWORD||'';return Boolean((p&&head(q,'authorization')==='Bearer '+p)||(token()&&cookie(q,'ah_crm_session')===token()))};
const body=(q:any)=>{if(q?.body&&typeof q.body==='object')return q.body;try{return JSON.parse(String(q?.body||'{}'))}catch{return {}}};
const map=(p:any)=>({id:String(p.id),title:String(p.name||''),propertyType:String(p.property_type||''),location:String(p.location||''),price:String(p.price||''),minBudget:null,maxBudget:null,area:String(p.area||''),bedrooms:String(p.configuration||''),status:String(p.status)==='active'?'Available':String(p.status||'Available'),description:String(p.verification_notes||''),createdAt:String(p.created_at||p.updated_at||''),photos:typeof p.photos_url==='string'&&p.photos_url?[p.photos_url]:[],videoUrl:String(p.video_url||''),isHot:Number(p.hot_score||0)>=70});
async function all(){const r=await fetch(URL+'/rest/v1/properties?select=*&order=created_at.desc',{headers:h()});if(!r.ok)throw new Error('Supabase read '+r.status);return (await r.json()).map(map)}
async function save(p:any){const row={id:p.id,name:p.title,location:p.location,property_type:p.propertyType,status:p.status==='Available'?'active':p.status.toLowerCase(),inventory_source:'crm',hot_score:p.isHot?100:0,price:p.price||null,area:p.area||null,configuration:p.bedrooms||null,video_url:p.videoUrl||null,photos_url:p.photos?.[0]||null,verification_status:'verified',verification_notes:p.description||null,is_public:false,created_at:p.createdAt,updated_at:new Date().toISOString()};const r=await fetch(URL+'/rest/v1/properties?on_conflict=id',{method:'POST',headers:h({Prefer:'resolution=merge-duplicates,return=representation'}),body:JSON.stringify(row)});if(!r.ok)throw new Error('Supabase write '+r.status);return map((await r.json())[0])}
export default async function handler(req:any,res:any){
 if(!ok(req))return out(res,401,{error:'Unauthorized'});
 try{
  if(req.method==='GET')return out(res,200,{properties:await all()});
  if(req.method!=='POST')return out(res,405,{error:'Method not allowed'});
  const b=body(req),action=String(b.action||'upsert'),items=await all();
  if(action==='delete'){const id=String(b.id||'');const r=await fetch(URL+'/rest/v1/properties?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:h()});if(!r.ok)throw new Error('Supabase delete '+r.status);return out(res,200,{ok:true,properties:await all()})}
  if(action==='uploadPhoto'||action==='deletePhoto')return out(res,409,{error:'Photo storage is temporarily unavailable while Vercel Blob is suspended.'});
  const old=items.find((x:any)=>x.id===String(b.id||''));const p={id:String(b.id||old?.id||crypto.randomUUID()),title:String(b.title??old?.title??'').trim(),propertyType:String(b.propertyType??old?.propertyType??'').trim(),location:String(b.location??old?.location??'').trim(),price:String(b.price??old?.price??'').trim(),area:String(b.area??old?.area??'').trim(),bedrooms:String(b.bedrooms??old?.bedrooms??'').trim(),status:['Available','Hold','Sold','Inactive'].includes(String(b.status))?String(b.status):old?.status||'Available',description:String(b.description??old?.description??'').trim(),createdAt:old?.createdAt||new Date().toISOString(),photos:Array.isArray(b.photos)?b.photos:(old?.photos||[]),videoUrl:String(b.videoUrl??old?.videoUrl??'').trim(),isHot:Boolean(b.isHot??old?.isHot??false),minBudget:null,maxBudget:null};
  if(!p.title||!p.propertyType||!p.location)return out(res,400,{error:'Title, property type and location are required.'});
  const saved=await save(p);return out(res,200,{ok:true,property:saved,properties:await all()});
 }catch(e:any){console.error('supabase properties error',e);return out(res,500,{error:'Unable to access property inventory.',detail:String(e?.message||e)})}
}