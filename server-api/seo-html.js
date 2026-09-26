const SUPABASE_URL='https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHhxYXVzanVjaXJueG1tanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjA4ODAsImV4cCI6MjEwNDc5Njg4MH0.L-tVG1EYLlnMFuiE9f2oIao-0lMpyh4tM50tYrHes7c';
const BASE='https://anjanayheights-9m6i.vercel.app';

function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function clean(v){return String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function meta(html,attrs,value){const marker='<meta '+attrs;const tag=marker+' content="'+esc(value)+'">';const i=html.toLowerCase().indexOf(marker.toLowerCase());return i>=0?html.slice(0,i)+tag+html.slice(i+html.slice(i).indexOf('>')+1):html.replace('</head>',tag+'\n</head>');}
function canonical(html,url){const i=html.toLowerCase().indexOf('<link rel="canonical"');const tag='<link rel="canonical" href="'+esc(url)+'">';return i>=0?html.slice(0,i)+tag+html.slice(i+html.slice(i).indexOf('>')+1):html.replace('</head>',tag+'\n</head>');}
async function getJson(url){const r=await fetch(url);if(!r.ok)throw new Error('inventory '+r.status);return r.json();}
function template(){return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Anjanay Heights</title><meta name="description" content="Verified property opportunities from Anjanay Heights."><style>body{font-family:Arial,sans-serif;margin:0;color:#111827}main{max-width:900px;margin:auto;padding:32px 20px}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#ecfdf5;color:#047857;font-weight:700;font-size:13px}h1{font-size:32px;line-height:1.2}h2{font-size:20px;margin-top:28px}.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.fact{border:1px solid #e5e7eb;border-radius:12px;padding:14px}.label{display:block;color:#6b7280;font-size:13px;margin-bottom:5px}.value{font-weight:700}.actions a{display:inline-block;margin:18px 8px 0 0;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:700;background:#111827;color:#fff}</style></head><body><main><div id="content"></div><section><h2>About Anjanay Heights</h2><p>Verified property opportunities from Anjanay Heights across Noida, Greater Noida, NCR and other locations. Availability and details are subject to verification.</p></section><div class="actions"><a href="https://wa.me/919289771222">WhatsApp an Expert</a><a href="tel:+919289771222">Call +91 92897 71222</a></div></main></body></html>';}
export default async function seoHtml(req,res){
  try{
    const kind=String(req.query?.kind||''), id=String(req.query?.id||''), slug=String(req.query?.slug||'').replace(/^\/+|\/+$/g,'').toLowerCase();
    let title='Anjanay Heights | Verified Property', description='Active, verified property opportunities from Anjanay Heights in Noida, Greater Noida and NCR.', canonicalUrl=BASE+'/', status=200;
    let schema={"@context":"https://schema.org","@type":"RealEstateAgent","name":"Anjanay Heights","url":BASE+'/'}, bodyContent='';
    if(kind==='property'&&id){
      const inventory=await getJson(BASE+'/api/index?route=inventory-public');
      const rows=Array.isArray(inventory?.properties)?inventory.properties:[];
      const p=rows.find(row=>String(row?.id||'')===id)||null;
      if(!p){status=404;title='Property Not Found | Anjanay Heights';description='The requested property is not currently available.';bodyContent='<div class="badge">Not Available</div><h1>Property Not Found</h1><p>The requested property is not currently available.</p>';}
      else{
        const name=clean(p.name)||'Verified Property',loc=clean(p.location),price=clean(p.price),area=clean(p.area),type=clean(p.property_type),configuration=clean(p.configuration),notes=clean(p.verification_notes);
        title=(name+' | '+loc+' | Anjanay Heights').slice(0,60);
        description=clean([name,loc,type,area,price,'Verified property listing from Anjanay Heights.'].filter(Boolean).join(' • ')).slice(0,155);
        canonicalUrl=BASE+'/property/'+encodeURIComponent(String(p.id));
        schema={"@context":"https://schema.org","@type":"RealEstateListing","name":name,"url":canonicalUrl,"description":description,"dateModified":p.updated_at||undefined,"address":{"@type":"PostalAddress","addressLocality":loc},"offers":{"@type":"Offer","priceCurrency":"INR","price":price}};
        if(p.photos_url)schema.image=[String(p.photos_url)];
        const facts=[['Location',loc],['Property Type',type],['Area',area],['Configuration',configuration],['Price',price],['Status','Active & Verified']].filter(x=>x[1]);
        bodyContent='<div class="badge">✓ Verified Property</div><h1>'+esc(name)+'</h1><p>'+esc(description)+'</p><div class="facts">'+facts.map(([l,v])=>'<div class="fact"><span class="label">'+esc(l)+'</span><span class="value">'+esc(v)+'</span></div>').join('')+'</div>'+(notes?'<h2>Verification</h2><p>'+esc(notes)+'</p>':'');
      }
    }else if(kind==='location'&&slug){
      const name=slug.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
      title=('Property in '+name+' | Anjanay Heights').slice(0,60);description=('Active, verified property opportunities in '+name+' from Anjanay Heights.').slice(0,155);canonicalUrl=BASE+'/locations/'+encodeURIComponent(slug);
      schema={"@context":"https://schema.org","@type":"CollectionPage","name":title,"url":canonicalUrl,"description":description};
      bodyContent='<div class="badge">Verified Properties</div><h1>Property in '+esc(name)+'</h1><p>'+esc(description)+'</p>';
    }else status=404;
    let html=template();
    html=html.replace('<div id="content"></div>','<div id="content">'+bodyContent+'</div>');
    html=html.replace('<title>Anjanay Heights</title>','<title>'+esc(title)+'</title>');
    html=html.replace('<meta name="description" content="Verified property opportunities from Anjanay Heights.">','<meta name="description" content="'+esc(description)+'">');
    html=meta(html,'property="og:title"',title);html=meta(html,'property="og:description"',description);html=meta(html,'property="og:url"',canonicalUrl);html=meta(html,'name="twitter:title"',title);html=meta(html,'name="twitter:description"',description);html=canonical(html,canonicalUrl);
    html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify(schema)+'</script></head>');
    if(status===404)html=meta(html,'name="robots"','noindex, follow');
    res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, s-maxage=300, stale-while-revalidate=3600'});res.end(html);
  }catch(e){res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('SEO page generation failed: '+String(e?.message||e));}
}