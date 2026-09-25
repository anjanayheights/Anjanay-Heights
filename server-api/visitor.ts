const URL='https://xctxqausjucirnxmmjrp.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';
const headers=()=>({apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'});
const send=(r:any,s:number,b:any)=>r.status(s).setHeader('Cache-Control','no-store').json(b);
const cookie=(q:any)=>{const raw=String(q?.headers?.cookie||'');const x=raw.split(';').map((v:string)=>v.trim()).find((v:string)=>v.startsWith('ah_visitor='));return x?decodeURIComponent(x.slice(11)):''};
export default async function handler(req:any,res:any){
 try{
  if(req.method==='GET'){
   const r=await fetch(URL+'/rest/v1/website_visitors?select=visitor_id,last_seen',{headers:headers()});if(!r.ok)throw new Error('visitor read '+r.status);
   const rows:any[]=await r.json(),cut=Date.now()-90000,active=rows.filter(x=>Date.parse(x.last_seen)>=cut).length;
   return send(res,200,{totalViewers:rows.length,activeVisitors:active});
  }
  if(req.method==='POST'){
   let id=cookie(req),isNew=false;if(!id){id=crypto.randomUUID();isNew=true}
   const r=await fetch(URL+'/rest/v1/website_visitors?on_conflict=visitor_id',{method:'POST',headers:{...headers(),Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({visitor_id:id,last_seen:new Date().toISOString()})});
   if(!r.ok)throw new Error('visitor write '+r.status);
   if(isNew)res.setHeader('Set-Cookie','ah_visitor='+encodeURIComponent(id)+'; Path=/; Max-Age=31536000; SameSite=Lax; Secure');
   return send(res,200,{ok:true,counted:isNew});
  }
  return send(res,405,{error:'Method not allowed'});
 }catch(e){console.error('visitor analytics error',e);return send(res,500,{error:'Unable to update visitor analytics.'})}
}