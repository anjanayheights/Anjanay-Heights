import React from 'react';

const modules = [
  {title:'Property Inventory', desc:'Add, edit and manage live inventory without touching website code.', path:'/admin/properties', icon:'🏠'},
  {title:'Lead Workspace', desc:'Central place for incoming leads, scoring and sales handling.', path:'/admin/workspace', icon:'👤'},
  {title:'Follow-up Automation', desc:'Work through due and scheduled follow-ups from one screen.', path:'/admin/followup-automation', icon:'⏰'},
  {title:'Site Visits', desc:'Manage site-visit requests and bookings.', path:'/admin/site-visits', icon:'📅'},
  {title:'Seasonal Demand', desc:'Review demand signals and priority property opportunities.', path:'/admin/seasonal-demand', icon:'🔥'},
  {title:'Social Sharing', desc:'Prepare and manage property sharing workflow.', path:'/admin/social-sharing', icon:'📣'},
  {title:'Sales Cockpit', desc:'Use the sales command center for daily action.', path:'/admin/sales-cockpit', icon:'🎯'},
  {title:'Management Dashboard', desc:'Management-level view of the business workflow.', path:'/admin/management', icon:'📊'},
];

export default function AutomationControlCenter(){
  return <div className="min-h-screen bg-[#F7F8FA] text-[#172033] p-5 md:p-8">
    <div className="max-w-6xl mx-auto">
      <div className="rounded-3xl bg-[#1A365D] text-white p-7 md:p-10">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#C2A36B]">Anjanay Heights</p>
        <h1 className="mt-2 text-3xl md:text-5xl font-serif">Automation Control Center</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Manage the existing sales machine from one place. Property, leads, follow-ups, site visits and marketing remain connected to the existing system.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">View Website</a>
          <a href="/admin/workspace" className="rounded-xl bg-[#C2A36B] px-4 py-2 text-sm font-bold text-[#172033]">Open CRM</a>
        </div>
      </div>
      <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map(m=><a key={m.path} href={m.path} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
          <div className="text-2xl">{m.icon}</div><h2 className="mt-4 font-bold">{m.title}</h2><p className="mt-2 text-sm leading-5 text-slate-500">{m.desc}</p><span className="mt-4 inline-block text-xs font-bold text-[#1A365D]">Open →</span>
        </a>)}
      </div>
      <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-bold text-emerald-900">Automation principle</p>
        <p className="mt-1 text-sm text-emerald-800">Update the source data in the management modules instead of editing the public website manually. Existing inventory and lead data are left untouched by this control center.</p>
      </div>
    </div>
  </div>;
}
