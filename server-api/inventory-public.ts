type Property={id:string;title:string;propertyType:string;location:string;price:string;minBudget:number|null;maxBudget:number|null;area:string;bedrooms:string;status:'Available'|'Hold'|'Sold'|'Inactive';description:string;createdAt:string;photos?:string[];videoUrl?:string};

const SUPABASE_URL='https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable__2iHvDMRRfVzkPYAQfQI6Q_7Df0v2UF';

function send(res:any,status:number,body:unknown){return res.status(status).setHeader('Cache-Control','no-store').setHeader('Pragma','no-cache').json(body)}

async function readSupabase():Promise<Property[]>{
  const url=`${SUPABASE_URL}/rest/v1/public_property_catalog?select=id,name,location,property_type,status,price,area,configuration,source_url,video_url,photos_url,verification_status,verification_notes,created_at,updated_at`;
  const r=await fetch(url,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${SUPABASE_PUBLISHABLE_KEY}`}});
  if(!r.ok)throw new Error(`Supabase inventory unavailable (${r.status})`);
  const rows:any[]=await r.json();
  return rows.map(p=>({
    id:String(p?.id||''),
    title:String(p?.name||'Property'),
    propertyType:String(p?.property_type||''),
    location:String(p?.location||''),
    price:String(p?.price||''),
    minBudget:null,
    maxBudget:null,
    area:String(p?.area||''),
    bedrooms:String(p?.configuration||''),
    status:(p?.status==='Available'?'Available':(p?.status||'Available')) as Property['status'],
    description:String(p?.verification_notes||''),
    createdAt:String(p?.created_at||p?.updated_at||new Date(0).toISOString()),
    photos:p?.photos_url?[String(p.photos_url)]:[],
    videoUrl:String(p?.video_url||'')
  })).filter(p=>p.id);
}

function matchesBhk(p:Property,bhk:string){
  if(!bhk)return true;
  const wanted=bhk.match(/\d+/)?.[0];
  if(!wanted)return true;
  const nums=String(p.bedrooms||'').match(/\d+(?:\.\d+)?/g)||[];
  return nums.includes(wanted);
}

function budgetOverlap(p:Property,budget:number|null){
  if(!budget)return true;
  const min=p.minBudget??null,max=p.maxBudget??null;
  if(min==null&&max==null)return true;
  return (min==null||min<=budget)&&(max==null||max>=budget||min<=budget);
}

export default async function handler(req:any,res:any){
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  try{
    const all=await readSupabase();
    const available=all.filter(p=>p.status==='Available');
    const rawUrl=String(req.url||'/');
    const url=new URL(rawUrl.startsWith('http')?rawUrl:`http://localhost${rawUrl.startsWith('/')?rawUrl:`/${rawUrl}`}`);
    const q=(url.searchParams.get('q')||'').trim().toLowerCase();
    const bhk=(url.searchParams.get('bhk')||'').trim();
    const location=(url.searchParams.get('location')||'').trim().toLowerCase();
    const type=(url.searchParams.get('type')||'').trim().toLowerCase();
    const budget=Number(url.searchParams.get('budget')||0)||null;
    const properties=available.filter(p=>{
      const hay=`${p.title} ${p.propertyType} ${p.location} ${p.price} ${p.area} ${p.bedrooms} ${p.description}`.toLowerCase();
      return (!q||hay.includes(q))&&(!location||p.location.toLowerCase().includes(location))&&(!type||p.propertyType.toLowerCase().includes(type))&&matchesBhk(p,bhk)&&budgetOverlap(p,budget);
    }).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).map(p=>({
      id:p.id,title:p.title,propertyType:p.propertyType,location:p.location,price:p.price,minBudget:p.minBudget,maxBudget:p.maxBudget,
      area:p.area,bedrooms:p.bedrooms,status:p.status,description:p.description,photos:p.photos||[],videoUrl:p.videoUrl||'',createdAt:p.createdAt,
      marketOpportunity:/third-party|market opportunity|researched/i.test(p.description)
    }));
    return send(res,200,{properties,availableCount:available.length,totalCount:all.length,updatedAt:new Date().toISOString()});
  }catch(e:any){
    return send(res,200,{properties:[],availableCount:0,totalCount:0,updatedAt:new Date().toISOString(),inventoryUnavailable:true,error:String(e?.message||'Unable to load live inventory.')});
  }
}
