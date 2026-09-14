import { get, list } from '@vercel/blob';

const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];
function h(req:any,n:string){const x=req?.headers;if(x?.get)return x.get(n)||'';return x?.[n.toLowerCase()]||x?.[n]||'';}
function out(res:any,s:number,b:unknown){return res.status(s).setHeader('Cache-Control','no-store').json(b);}
function ok(req:any){const p=process.env.DASHBOARD_PASSWORD||'';return !p||h(req,'authorization')===`Bearer ${p}`;}
function blobErr(e:unknown){return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${String((e as any)?.name||'')} ${String((e as any)?.message||'')}`);}
async function withBlob<T>(fn:(a:Record<string,string>)=>Promise<T>){let last:any;for(const a of [{},...blobAuthCandidates] as Record<string,string>[]){try{return await fn(a)}catch(e){last=e;if(!blobErr(e))throw e}}throw last}
async function read(url:string){const r=await withBlob(a=>get(url,{access:'private',useCache:false,...a}));return r?.statusCode===200&&r.stream?await new Response(r.stream).json():null}
async function inventory(){const r=await withBlob(a=>list({prefix:'crm/properties/',...a}));const rows=await Promise.all(r.blobs.map(b=>read(b.url).catch(()=>null)));return rows.filter((x:any)=>x&&x.status!=='Sold'&&x.status!=='Closed'&&x.status!=='Unavailable');}
function num(v:any){const s=String(v??'').toLowerCase().replace(/,/g,'');let n=parseFloat(s.replace(/[^0-9.]/g,''))||0;if(/crore|cr/.test(s))n*=10000000;else if(/lakh|lac/.test(s))n*=100000;return n}
function text(v:any){return String(v??'').toLowerCase().trim()}
function match(lead:any,p:any){let score=0;const reasons:string[]=[];const loc=text(lead.location),pl=text(p.location);if(loc&&pl&&(pl.includes(loc)||loc.includes(pl))){score+=35;reasons.push('location match')}else if(loc&&pl&&loc.split(/[, -]+/).some((x:string)=>x.length>3&&pl.includes(x))){score+=15;reasons.push('nearby location')}
const lt=text(lead.property_type||lead.propertyType),pt=text(p.type||p.propertyType);if(lt&&pt&&(pt.includes(lt)||lt.includes(pt))){score+=20;reasons.push('property type match')}
const lbk=text(lead.bhk||lead.bedrooms),pbk=text(p.bhk||p.bedrooms);if(lbk&&pbk&&(/\d+/.exec(lbk)?.[0]===/\d+/.exec(pbk)?.[0])){score+=20;reasons.push('BHK match')}
const budget=num(lead.budget);const price=num(p.price||p.minBudget||p.maxBudget);if(budget&&price){if(price<=budget){score+=20;reasons.push('within budget')}else if(price<=budget*1.1){score+=10;reasons.push('near budget')}}
if(p.status==='Available')score+=5;return {score,reasons};}
export default async function handler(req:any,res:any){if(req.method!=='GET'&&req.method!=='POST')return out(res,405,{error:'Method not allowed'});if(!ok(req))return out(res,401,{error:'Unauthorized'});try{const lead=req.method==='POST'?req.body||{}:req.query||{};const props=await inventory();const ranked=props.map((p:any)=>{const m=match(lead,p);return {id:p.id,title:p.title||p.name,location:p.location,propertyType:p.type||p.propertyType,price:p.price||p.minBudget,bedrooms:p.bedrooms||p.bhk,area:p.area,photos:p.photos||[],videoUrl:p.videoUrl||'',status:p.status,score:m.score,reasons:m.reasons}}).filter((x:any)=>x.score>0).sort((a:any,b:any)=>b.score-a.score).slice(0,5);return out(res,200,{ok:true,count:ranked.length,matches:ranked});}catch(e){console.error('lead-property-match',e);return out(res,500,{error:'Unable to match live inventory'});}}
