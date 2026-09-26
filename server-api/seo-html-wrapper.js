const BASE='https://anjanayheights-9m6i.vercel.app';

export default async function seoHtml(req,res){
  let status=200;
  let headers={};
  let body='';
  const capture={
    writeHead:(s,h)=>{status=s;headers=h||{};},
    end:(b)=>{body=String(b||'');},
    status:(s)=>{status=s;return capture;},
    setHeader:()=>capture,
    send:(b)=>{body=String(b||'');},
  };
  const {default:render}=await import('./seo-html.js');
  await render(req,capture);
  if(status===200 && String(req.query?.kind||'')==='property' && String(req.query?.id||'')){
    try{
      const r=await fetch(BASE+'/api/index?route=inventory-public');
      const data=await r.json();
      const id=String(req.query.id);
      const p=(data?.properties||[]).find(x=>String(x?.id||'')===id);
      const name=String(p?.title||'').trim();
      if(name){
        body=body.replaceAll('Verified Property',name);
      }
    }catch{}
  }
  res.writeHead(status,headers);
  res.end(body);
}
