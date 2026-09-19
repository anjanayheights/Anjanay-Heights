import { get, list, put } from '@vercel/blob';
import { createHash, createHmac, createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const SUPABASE_URL='https://xctxqausjucirnxmmjrp.supabase.co';
const SUPABASE_KEY='sb_publishable__2iHvDMRRfVzkPYAQfQI6Q_7Df0v2UF';
const TABLE='crm_vault_events';
const SALT='anjanay-heights-crm-vault-v1';

const blobAuth=[
  ...(process.env.VERCEL_OIDC_TOKEN&&process.env.BLOB_STORE_ID?[{oidcToken:process.env.VERCEL_OIDC_TOKEN,storeId:process.env.BLOB_STORE_ID}]:[]),
  ...(process.env.BLOB_READ_WRITE_TOKEN?[{token:process.env.BLOB_READ_WRITE_TOKEN}]:[])
];

function send(res:any,status:number,body:unknown){return res.status(status).setHeader('Cache-Control','no-store, no-cache, must-revalidate').setHeader('Pragma','no-cache').json(body)}
function header(req:any,name:string){const h=req?.headers;if(h&&typeof h.get==='function')return h.get(name)||'';return h?.[name.toLowerCase()]||h?.[name]||''}
function authorized(req:any){const p=process.env.DASHBOARD_PASSWORD||'';const bearer=header(req,'authorization');const expected=p?createHmac('sha256',p).update('anjanay-heights-crm-session').digest('hex'):'';const raw=String(header(req,'cookie')||'');return Boolean(p&&bearer===`Bearer ${p}`)||Boolean(expected&&raw.split(';').some((x:string)=>x.trim()===`ah_crm_session=${expected}`))}
function key(){const p=process.env.DASHBOARD_PASSWORD||'';return p?scryptSync(p,SALT,32):null}
function enc(value:unknown){const k=key();if(!k)throw new Error('CRM vault key unavailable');const iv=randomBytes(12);const c=createCipheriv('aes-256-gcm',k,iv);const payload=Buffer.concat([c.update(JSON.stringify(value),'utf8'),c.final()]);return{payload:payload.toString('base64'),iv:iv.toString('base64'),tag:c.getAuthTag().toString('base64')}}
function dec(row:any){const k=key();if(!k||!row?.payload)return null;try{const d=createDecipheriv('aes-256-gcm',k,Buffer.from(row.iv,'base64'));d.setAuthTag(Buffer.from(row.tag,'base64'));return JSON.parse(Buffer.concat([d.update(Buffer.from(row.payload,'base64')),d.final()]).toString('utf8'))}catch{return null}}
const sh=()=>({apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`});
async function vaultRead(){const r=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=record_id,created_at,payload,iv,tag&record_type=eq.lead&order=created_at.asc&limit=5000`,{headers:sh()});if(!r.ok)throw new Error(`vault read ${r.status}`);const rows=await r.json();return(Array.isArray(rows)?rows:[]).map((x:any)=>({id:x.record_id,value:dec(x)})).filter((x:any)=>x.value)}
async function vaultWrite(lead:any){if(!key())return;const e=enc(lead);const r=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`,{method:'POST',headers:{...sh(),'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({record_type:'lead',record_id:String(lead.id),...e})});if(!r.ok)throw new Error(`vault write ${r.status}`)}
async function blobList(){let last:any;for(const a of [{},...blobAuth])try{return await list({prefix:'leads/',...a})}catch(e){last=e}throw last||new Error('Blob unavailable')}
async function blobRead(url:string){let last:any;for(const a of [{},...blobAuth])try{const r:any=await get(url,{access:'private',...a});return r?.stream?await new Response(r.stream).json():null}catch(e){last=e}throw last||new Error('Blob read unavailable')}
function phone(v:string){const d=String(v||'').replace(/\D/g,'');return d.length===10?`91${d}`:d}
function score(l:any){let s=0;const t=[l.property_type,l.location,l.budget,l.timeline,l.requirement,l.message].join(' ').toLowerCase();if(l.phone)s+=10;if(l.email)s+=5;if(/urgent|today|asap|site visit|this week/.test(t))s+=25;if(/ready|booking|purchase|investment/.test(t))s+=20;if(l.budget)s+=15;if(l.location)s+=10;if(l.property_type)s+=10;return Math.min(100,s)}
function priority(s:number){return s>=75?'Very Hot':s>=55?'Hot':s>=30?'Warm':'Cold'}
function parseBody(req:any){if(req?.body&&typeof req.body==='object')return req.body;try{return JSON.parse(String(req?.body||'{}'))}catch{return{}}}

export default async function handler(req:any,res:any){
  if(req.method==='GET'){
    if(!authorized(req))return send(res,401,{error:'Unauthorized'});
    try{
      const r=await blobList();
      const leads=(await Promise.all((r?.blobs||[]).map((b:any)=>blobRead(b.url).catch(()=>null)))).filter(Boolean);
      return send(res,200,{leads});
    }catch(blobError){
      try{return send(res,200,{leads:(await vaultRead()).map((x:any)=>x.value),storageFallback:'supabase-vault'})}
      catch(vaultError){console.error('direct leads GET failed',blobError,vaultError);return send(res,500,{error:'Unable to load leads.'})}
    }
  }
  if(req.method==='POST'){
    try{
      const b=parseBody(req);const name=String(b.name||'').trim();const rawPhone=String(b.phone||'').trim();
      if(!name||!rawPhone)return send(res,400,{error:'Name and phone are required.'});
      const lead={id:randomUUID(),created_at:new Date().toISOString(),name,phone:rawPhone,email:String(b.email||'').trim(),source:String(b.source||b.lead_source||'Website'),property_name:String(b.property_name||'').trim(),property_type:String(b.property_type||'').trim(),location:String(b.location||'').trim(),budget:String(b.budget||'').trim(),timeline:String(b.timeline||'').trim(),requirement:String(b.requirement||'').trim(),message:String(b.message||'').trim(),bhk:String(b.bhk||'').trim()};
      let saved=lead;
      try{await put(`leads/phone-${createHash('sha256').update(phone(rawPhone)).digest('hex')}.json`,JSON.stringify(lead),{access:'private',addRandomSuffix:false,contentType:'application/json',allowOverwrite:false,...(blobAuth[0]||{})})}
      catch{try{await vaultWrite(lead)}catch(e){console.error('direct lead vault write failed',e);throw e}}
      const s=score(saved);return send(res,200,{ok:true,lead:saved,score:s,priority:priority(s),qualification:s>=55?'Qualified':'New',followUp:`${new Date().toISOString().slice(0,10)}T10:00`,nextAction:'Call',whatsappUrl:phone(saved.phone)?`https://wa.me/${phone(saved.phone)}`:''});
    }catch(e){console.error('direct leads POST failed',e);return send(res,500,{error:'Unable to save your request.'})}
  }
  return send(res,405,{error:'Method not allowed'})
}
