const SUPABASE_URL='https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInR5cCI6IkpXVCJ9'.replace('eyJpc3MiOiJzdXBhYmFzZSIs','');
const BASE='https://anjanayheights-9m6i.vercel.app';

function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function clean(v){return String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function tag(html,name,attrs,value){const re=new RegExp('<meta\\s+[^>]*'+name+'=["\\'][^"\\']+["\\'][^>]*>','i');const t='<meta '+attrs+' content="'+esc(value)+'">';return re.test(html)?html.replace(re,t):html.replace('</head>',t+'\\n</head>');}
function linkCanonical(html,url){const re=/<link\\s+rel=["']canonical["'][^>]*>/i;const t='<link rel="canonical" href="'+esc(url)+'">';return re.test(html)?html.replace(re,t):html.replace('</head>',t+'\\n</head>');}
async function getJson(url){const r=await fetch(url,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:'Bearer '+SUPABASE_ANON_KEY}});if(!r.ok)throw new Error('inventory '+r.status);return r.json();}
async function template(req){
  const host=String(req.headers?.host||'anjanayheights-9m6i.vercel.app').split(',')[0];
  const proto=String(req.headers?.['x-forwarded-proto']||'https');
  const origin=proto+'://'+host;
  const r=await fetch(origin+'/index.html');
  if(!r.ok)throw new Error('template '+r.status);
  return r.text();
}
export default async function seoHtml(req,res){
  try{
    const kind=String(req.query?.kind||'');
    const id=String(req.query?.id||'');
    const slug=String(req.query?.slug||'').replace(/^\\/+|\\/+$/g,'').toLowerCase();
    let title='Anjanay Heights | Verified Property';
    let description='Active, verified property opportunities from Anjanay Heights in Noida, Greater Noida and NCR.';
    let canonical=BASE+'/';
    let schema={"@context":"https://schema.org","@type":"RealEstateAgent","name":"Anjanay Heights","url":BASE+'/'};
    let status=200;
    if(kind==='property'&&id){
      const rows=await getJson(SUPABASE_URL+'/rest/v1/properties?select=id,name,location,property_type,status,price,area,configuration,verification_status,verification_notes,photos_url,updated_at,hot_score&status=eq.active&verification_status=eq.verified&is_public=eq.true&id=eq.'+encodeURIComponent(id));
      const p=Array.isArray(rows)?rows[0]:null;
      if(!p){status=404;title='Property Not Found | Anjanay Heights';description='The requested property is not currently available.';}
      else{
        const name=clean(p.name)||'Verified Property', loc=clean(p.location), price=clean(p.price), area=clean(p.area), type=clean(p.property_type);
        title=(name+' | '+loc+' | Anjanay Heights').slice(0,60);
        description=clean([name,loc,type,area,price,'Verified property listing from Anjanay Heights.'].filter(Boolean).join(' • ')).slice(0,155);
        canonical=BASE+'/property/'+encodeURIComponent(String(p.id));
        schema={"@context":"https://schema.org","@type":"RealEstateListing","name":name,"url":canonical,"description":description,"dateModified":p.updated_at||undefined,"address":{"@type":"PostalAddress","addressLocality":loc},"offers":{"@type":"Offer","priceCurrency":"INR","price":price}};
        if(p.photos_url) schema.image=[String(p.photos_url)];
      }
    }else if(kind==='location'&&slug){
      const name=slug.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
      title=('Property in '+name+' | Anjanay Heights').slice(0,60);
      description=('Active, verified property opportunities in '+name+' from Anjanay Heights.').slice(0,155);
      canonical=BASE+'/locations/'+encodeURIComponent(slug);
      schema={"@context":"https://schema.org","@type":"CollectionPage","name":title,"url":canonical,"description":description,"isPartOf":{"@type":"WebSite","name":"Anjanay Heights","url":BASE+'/'},"about":{"@type":"Place","name":name}};
    }else{status=404;}
    let html=await template(req);
    html=html.replace(/<title>[^<]*<\\/title>/i,'<title>'+esc(title)+'</title>');
    html=html.replace(/<meta\\s+name=["']description["'][^>]*>/i,'<meta name="description" content="'+esc(description)+'">');
    html=tag(html,'property="og:title"','property="og:title"',title);
    html=tag(html,'property="og:description"','property="og:description"',description);
    html=tag(html,'property="og:url"','property="og:url"',canonical);
    html=tag(html,'name="twitter:title"','name="twitter:title"',title);
    html=tag(html,'name="twitter:description"','name="twitter:description"',description);
    html=linkCanonical(html,canonical);
    html=html.replace(/<script\\s+type=["']application\\/ld\\+json["'][^>]*>.*?<\\/script>/is,'<script type="application/ld+json">'+JSON.stringify(schema)+'</script>');
    if(status===404)html=tag(html,'name="robots"','name="robots"','noindex, follow');
    res.status(status).setHeader('Content-Type','text/html; charset=utf-8').setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=3600').send(html);
  }catch(e){
    res.status(500).setHeader('Cache-Control','no-store').send('SEO page generation failed.');
  }
}