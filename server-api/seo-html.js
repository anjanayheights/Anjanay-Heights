const SUPABASE_URL='https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';
const BASE='https://anjanayheights-9m6i.vercel.app';

function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function clean(v){return String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function meta(html,attrs,value){const marker='<meta '+attrs;const tag=marker+' content="'+esc(value)+'">';const i=html.toLowerCase().indexOf(marker.toLowerCase());return i>=0?html.slice(0,i)+tag+html.slice(i+html.slice(i).indexOf('>')+1):html.replace('</head>',tag+'\n</head>');}
function canonical(html,url){const i=html.toLowerCase().indexOf('<link rel="canonical"');const tag='<link rel="canonical" href="'+esc(url)+'">';return i>=0?html.slice(0,i)+tag+html.slice(i+html.slice(i).indexOf('>')+1):html.replace('</head>',tag+'\n</head>');}
async function getJson(url){const r=await fetch(url,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:'Bearer '+SUPABASE_ANON_KEY}});if(!r.ok)throw new Error('inventory '+r.status);return r.json();}
function template(){return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Anjanay Heights</title><meta name="description" content="Verified property opportunities from Anjanay Heights."></head><body><div id="root"></div></body></html>';}
export default async function seoHtml(req,res){
  try{
    const kind=String(req.query?.kind||''), id=String(req.query?.id||''), slug=String(req.query?.slug||'').replace(/^\/+|\/+$/g,'').toLowerCase();
    let title='Anjanay Heights | Verified Property', description='Active, verified property opportunities from Anjanay Heights in Noida, Greater Noida and NCR.', canonicalUrl=BASE+'/', status=200;
    let schema={"@context":"https://schema.org","@type":"RealEstateAgent","name":"Anjanay Heights","url":BASE+'/'};
    if(kind==='property'&&id){
      const rows=await getJson(SUPABASE_URL+'/rest/v1/properties?select=id,name,location,property_type,status,price,area,configuration,verification_status,verification_notes,photos_url,updated_at,hot_score&status=eq.active&verification_status=eq.verified&is_public=eq.true&id=eq.'+encodeURIComponent(id));
      const p=Array.isArray(rows)?rows[0]:null;
      if(!p){status=404;title='Property Not Found | Anjanay Heights';description='The requested property is not currently available.';}
      else{
        const name=clean(p.name)||'Verified Property',loc=clean(p.location),price=clean(p.price),area=clean(p.area),type=clean(p.property_type);
        title=(name+' | '+loc+' | Anjanay Heights').slice(0,60);
        description=clean([name,loc,type,area,price,'Verified property listing from Anjanay Heights.'].filter(Boolean).join(' • ')).slice(0,155);
        canonicalUrl=BASE+'/property/'+encodeURIComponent(String(p.id));
        schema={"@context":"https://schema.org","@type":"RealEstateListing","name":name,"url":canonicalUrl,"description":description,"dateModified":p.updated_at||undefined,"address":{"@type":"PostalAddress","addressLocality":loc},"offers":{"@type":"Offer","priceCurrency":"INR","price":price}};
        if(p.photos_url)schema.image=[String(p.photos_url)];
      }
    }else if(kind==='location'&&slug){
      const name=slug.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
      title=('Property in '+name+' | Anjanay Heights').slice(0,60);description=('Active, verified property opportunities in '+name+' from Anjanay Heights.').slice(0,155);canonicalUrl=BASE+'/locations/'+encodeURIComponent(slug);
      schema={"@context":"https://schema.org","@type":"CollectionPage","name":title,"url":canonicalUrl,"description":description};
    }else status=404;
    let html=template();
    html=html.replace('<title>Anjanay Heights</title>','<title>'+esc(title)+'</title>');
    html=html.replace('<meta name="description" content="Verified property opportunities from Anjanay Heights.">','<meta name="description" content="'+esc(description)+'">');
    html=meta(html,'property="og:title"',title);html=meta(html,'property="og:description"',description);html=meta(html,'property="og:url"',canonicalUrl);html=meta(html,'name="twitter:title"',title);html=meta(html,'name="twitter:description"',description);html=canonical(html,canonicalUrl);
    html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify(schema)+'</script></head>');
    if(status===404)html=meta(html,'name="robots"','noindex, follow');
    res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, s-maxage=300, stale-while-revalidate=3600'});res.end(html);
  }catch(e){res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('SEO page generation failed: '+String(e?.message||e));}
}