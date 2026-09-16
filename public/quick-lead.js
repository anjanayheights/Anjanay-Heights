(() => {
  const WA = '919289771222';
  const root = document.createElement('div');
  root.id = 'ah-quick-lead';
  root.innerHTML = `<style>
    #ah-quick-lead{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483640;font-family:Arial,sans-serif}
    #ah-quick-lead .bar{display:flex;gap:8px;max-width:720px;margin:auto;background:#1A365D;padding:9px;border-radius:12px;box-shadow:0 10px 35px rgba(0,0,0,.25)}
    #ah-quick-lead button{flex:1;border:0;border-radius:8px;padding:12px 10px;font-weight:700;font-size:12px;cursor:pointer}
    #ah-quick-lead .enquire{background:#C2A36B;color:#fff}.whatsapp{background:#25D366;color:#fff}.call{background:#fff;color:#1A365D}
    #ah-quick-lead .modal{position:fixed;inset:0;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:18px}
    #ah-quick-lead .box{background:#fff;width:min(430px,100%);border-radius:14px;padding:22px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3)}
    #ah-quick-lead input,#ah-quick-lead select{width:100%;box-sizing:border-box;padding:13px;margin:0 0 10px;border:1px solid #ddd;border-radius:8px;font-size:14px}
    #ah-quick-lead h3{margin:0 0 5px;color:#1A365D;font-size:22px}#ah-quick-lead p{margin:0 0 16px;color:#666;font-size:13px}
    #ah-quick-lead .submit{width:100%;background:#1A365D;color:#fff;padding:14px;border:0;border-radius:8px;font-weight:700}
    @media(min-width:768px){#ah-quick-lead{left:auto;width:430px}.bar{margin-right:0!important}.bar button{display:none}.bar .enquire{display:block!important}}
  </style><div class="bar"><button class="enquire">Get Property Options</button><button class="whatsapp">WhatsApp</button><button class="call">Call Sales</button></div>`;
  document.body.appendChild(root);
  const close = () => root.querySelector('.modal')?.remove();
  const open = () => {
    if(root.querySelector('.modal')) return;
    const modal=document.createElement('div'); modal.className='modal';
    modal.innerHTML=`<div class="box"><button class="x" style="position:absolute;right:12px;top:8px;border:0;background:none;font-size:25px;color:#777">×</button><h3>Find a Property</h3><p>Tell us what you need. A consultant will contact you with suitable options.</p><form><input name="name" required placeholder="Your name" autocomplete="name"><input name="phone" required inputmode="tel" placeholder="WhatsApp / mobile number" autocomplete="tel"><select name="lead_type" required><option value="" disabled selected>Looking to...</option><option value="buy">Buy Property</option><option value="invest">Invest</option><option value="sell">Sell Property</option></select><button class="submit" type="submit">Get My Property Options</button><div class="status" style="text-align:center;font-size:12px;color:#666;margin-top:9px;min-height:16px"></div></form></div>`;
    root.appendChild(modal); modal.querySelector('.x').onclick=close;
    modal.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),s=modal.querySelector('.status'),b=modal.querySelector('.submit');const phone=String(fd.get('phone')||'').replace(/\D/g,'');if(phone.length<10){s.textContent='Please enter a valid mobile number.';return}b.disabled=true;b.textContent='Connecting...';try{const p=new URLSearchParams({source:new URLSearchParams(location.search).get('utm_source')||'Website Quick Lead',utm_source:new URLSearchParams(location.search).get('utm_source')||'',utm_medium:new URLSearchParams(location.search).get('utm_medium')||'',utm_campaign:new URLSearchParams(location.search).get('utm_campaign')||'',name:String(fd.get('name')||''),phone,lead_type:String(fd.get('lead_type')||''),requirement:'Quick website enquiry'});const r=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:p});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error();s.textContent='✓ Request received. Opening WhatsApp...';setTimeout(()=>{close();window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(`Hi Anjanay Heights, I am ${fd.get('name')}. I want to ${fd.get('lead_type')} a property. Please share suitable options.`),'_blank','noopener,noreferrer')},400)}catch{b.disabled=false;b.textContent='Get My Property Options';s.textContent='Could not connect. Please try again.'}};
  };
  root.querySelector('.enquire').onclick=open;
  root.querySelector('.whatsapp').onclick=()=>window.open('https://wa.me/'+WA+'?text='+encodeURIComponent('Hi Anjanay Heights, I am looking for a property. Please help me with suitable options.'),'_blank','noopener,noreferrer');
  root.querySelector('.call').onclick=()=>{location.href='tel:+919289771222'};
})();
