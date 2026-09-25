const localities=['noida','greater-noida','greater-noida-west','noida-extension','yamuna-expressway','yeida','jewar','faridabad','ghaziabad','gurgaon','delhi-ncr'];

export default async function sitemap(req:any,res:any){
  if(req.method!=='GET') return res.status(405).end();
  const host=String(req.headers?.host||'anjanayheights-9m6i.vercel.app');
  const proto=String(req.headers?.['x-forwarded-proto']||'https');
  const origin=proto+'://'+host;
  const urls:string[]=[origin+'/',...localities.map(s=>origin+'/locations/'+s)];
  try{
    const r=await fetch(origin+'/api/inventory-public');
    if(r.ok){
      const data:any=await r.json();
      for(const p of (Array.isArray(data?.properties)?data.properties:[])) if(p?.id) urls.push(origin+'/property/'+encodeURIComponent(String(p.id)));
    }
  }catch{}
  const xml='<?xml version="1.0" encoding="UTF-8"?>'+'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+escapeXml(u)+'</loc></url>').join('')+'</urlset>';
  return res.status(200).setHeader('Content-Type','application/xml; charset=utf-8').setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400').send(xml);
}
function escapeXml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
