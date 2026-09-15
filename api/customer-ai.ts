import { GoogleGenAI } from '@google/genai';

function send(res:any,status:number,body:any){return res.status(status).setHeader('Cache-Control','no-store').json(body)}
function origin(req:any){const proto=String(req.headers?.['x-forwarded-proto']||'https');const host=String(req.headers?.host||process.env.VERCEL_URL||'');return host?`${proto}://${host}`:''}
function clean(v:any,max=500){return String(v??'').trim().slice(0,max)}

export default async function handler(req:any,res:any){
  if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
  if(!process.env.GEMINI_API_KEY)return send(res,503,{error:'AI advisor is not configured yet.'});
  const question=clean(req.body?.question,800); if(!question)return send(res,400,{error:'Ask a property question.'});
  try{
    const base=origin(req); const inv=await fetch(`${base}/api/inventory-public`,{headers:{'x-ai-internal':'1'},cache:'no-store'}); if(!inv.ok)throw new Error('Live inventory unavailable');
    const data=await inv.json(); const properties=Array.isArray(data?.properties)?data.properties.slice(0,120):[];
    const facts=properties.map((p:any)=>({id:p.id,title:p.title,propertyType:p.propertyType,location:p.location,price:p.price,area:p.area,bedrooms:p.bedrooms,status:p.status,description:p.description,photos:p.photos,videoUrl:p.videoUrl}));
    const prompt=`You are the ANJANAY HEIGHTS property advisor. Answer the customer in clear Indian English/Hinglish. Use ONLY the LIVE INVENTORY below. Never invent price, availability, BHK, area, possession, RERA, builder, amenities, ROI, legal or loan facts. If the inventory does not contain an answer, say that the consultant needs to confirm it. If the customer gives a requirement, recommend at most 3 matching available properties from the supplied inventory and explain the match briefly. Keep the answer concise and sales-oriented. Encourage a site visit when appropriate. Do not claim a booking or reservation is confirmed.\n\nCUSTOMER QUESTION:\n${question}\n\nLIVE INVENTORY:\n${JSON.stringify(facts)}`;
    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}); const model=process.env.GEMINI_MODEL||'gemini-3.8-flash';
    const response=await ai.models.generateContent({model,contents:prompt,config:{maxOutputTokens:900}}); const text=response.text?.trim(); if(!text)return send(res,502,{error:'AI returned no answer.'});
    const mentioned=facts.filter((p:any)=>text.toLowerCase().includes(String(p.title||'').toLowerCase())).slice(0,3).map((p:any)=>p.id);
    return send(res,200,{text,propertyIds:mentioned,inventoryUpdatedAt:data?.updatedAt||null});
  }catch(e){console.error('customer-ai error',e);return send(res,500,{error:'Unable to answer right now. Please use WhatsApp Sales for immediate help.'});}
}