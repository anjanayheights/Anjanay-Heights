const localities=['noida','greater-noida','greater-noida-west','noida-extension','yamuna-expressway','yeida','jewar','faridabad','ghaziabad','gurgaon','delhi-ncr'];

const SUPABASE_URL='https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';
const SITE_ORIGIN='https://anjanayheights-9m6i.vercel.app';

export default async function sitemap(req:any,res:any){
  if(req.method!=='GET') return res.status(405).end();
  const urls:string[]=[SITE_ORIGIN+'/',...localities.map(s=>SITE_ORIGIN+'/locations/'+s)];
  try{
    const r=await fetch(SUPABASE_URL+'/rest/v1/properties?select=id&status=eq.active&verification_status=eq.verified&is_public=eq.true',{
      headers:{apikey:SUPABASE_ANON_KEY},
    });
    if(r.ok){
      const data:any[]=await r.json();
      for(const p of data) if(p?.id) urls.push(SITE_ORIGIN+'/property/'+encodeURIComponent(String(p.id)));
    }
  }catch{}
  const xml='<?xml version="1.0" encoding="UTF-8"?>'+'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+escapeXml(u)+'</loc></url>').join('')+'</urlset>';
  return res.status(200).setHeader('Content-Type','application/xml; charset=utf-8').setHeader('X-Robots-Tag','noindex').setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400').send(xml);
}
function escapeXml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
