const URL='https://xctxqausjucirnxmmjrp.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';
const headers=()=>({apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'});
const send=(r:any,s:number,b:any)=>r.status(s).setHeader('Cache-Control','no-store').json(b);
const cookie=(q:any)=>{const raw=String(q?.headers?.cookie||'');const x=raw.split(';').map((v:string)=>v.trim()).find((v:string)=>v.startsWith('ah_visitor='));return x?decodeURIComponent(x.slice(11)):''};
export default async function handler(req:any,res:any){
 try{
  if(req.method==='GET'){
   const [vr,pr]=await Promise.all([
    fetch(URL+'/rest/v1/website_visitors?select=visitor_id,first_seen,last_seen',{headers:headers()}),
    fetch(URL+'/rest/v1/website_page_views?select=path,property_id,viewed_at&order=viewed_at.desc&limit=500',{headers:headers()})
   ]);
   if(!vr.ok||!pr.ok)throw new Error('visitor analytics read failed');
   const rows:any[]=await vr.json(), views:any[]=await pr.json(), now=Date.now(), cut=now-90000;
   const todayStart=new Date();todayStart.setHours(0,0,0,0);
   const active=rows.filter(x=>Date.parse(x.last_seen)>=cut).length;
   const today=rows.filter(x=>Date.parse(x.first_seen)>=todayStart.getTime()).length;
   const pathCounts=new Map<string,number>(), propCounts=new Map<string,number>();
   views.forEach(v=>{pathCounts.set(v.path,(pathCounts.get(v.path)||0)+1);if(v.property_id)propCounts.set(v.property_id,(propCounts.get(v.property_id)||0)+1)});
   const topPages=[...pathCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([path,views])=>({path,views}));
   const topPropertyIds=[...propCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
   let topProperties:any[]=[];
   if(topPropertyIds.length){
    const ids=topPropertyIds.map(x=>x[0]).join(',');
    const rr=await fetch(URL+'/rest/v1/properties?select=id,name&or='+encodeURIComponent('id.in.('+ids+')'),{headers:headers()});
    if(rr.ok){const props:any[]=await rr.json();const names=new Map(props.map(p=>[p.id,p.name]));topProperties=topPropertyIds.map(([id,views])=>({id,name:names.get(id)||'Property',views}))}
   }
   return send(res,200,{totalViewers:rows.length,activeVisitors:active,todayVisitors:today,topPages,topProperties});
  }
  if(req.method==='POST'){
   let id=cookie(req),isNew=false;if(!id){id=crypto.randomUUID();isNew=true}
   const path=String(req.headers?.referer||req.headers?.['x-page-path']||'/').replace(/^https?:\/\/[^/]+/,'')||'/';
   const propertyMatch=path.match(/^\/property\/([^/?#]+)/);const propertyId=propertyMatch?decodeURIComponent(propertyMatch[1]):null;
   const r=await fetch(URL+'/rest/v1/website_visitors?on_conflict=visitor_id',{method:'POST',headers:{...headers(),Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({visitor_id:id,last_seen:new Date().toISOString(),last_path:path,...(isNew?{first_path:path}:{})})});
   if(!r.ok)throw new Error('visitor write '+r.status);
   await fetch(URL+'/rest/v1/website_page_views',{method:'POST',headers:{...headers(),Prefer:'return=minimal'},body:JSON.stringify({visitor_id:id,path,property_id:propertyId})});
   if(isNew)res.setHeader('Set-Cookie','ah_visitor='+encodeURIComponent(id)+'; Path=/; Max-Age=31536000; SameSite=Lax; Secure');
   return send(res,200,{ok:true,counted:isNew});
  }
  return send(res,405,{error:'Method not allowed'});
 }catch(e){console.error('visitor analytics error',e);return send(res,500,{error:'Unable to update visitor analytics.'})}
}