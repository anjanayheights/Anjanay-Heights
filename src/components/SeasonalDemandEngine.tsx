import { useMemo, useState } from 'react';

const plan = [
  ['January','Residential • Plots • Investment','High','End-user + investor'],
  ['February','Residential • Plots • Investment','High','End-user + investor'],
  ['March','Residential • Commercial','High','End-user + business'],
  ['April','Residential • Commercial','High','End-user + business'],
  ['May','Ready-to-move • Affordable homes','Medium','End-user'],
  ['June','Ready-to-move • Affordable homes','Medium','End-user'],
  ['July','Residential • Plots • Investment','High','Investor + end-user'],
  ['August','Residential • Plots • Investment','High','Investor + end-user'],
  ['September','Residential • Plots • Commercial','Very High','Festive/pre-festive buyers'],
  ['October','Homes • Plots • Commercial','Very High','Festive demand'],
  ['November','Premium homes • Investment • Commercial','Very High','Festive + investors'],
  ['December','Premium homes • Investment • Commercial','Very High','Year-end buyers'],
];

export default function SeasonalDemandEngine() {
  const month = new Date().toLocaleString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' });
  const [selected, setSelected] = useState(month);
  const current = useMemo(() => plan.find((p) => p[0] === selected) || plan[0], [selected]);
  return <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
    <div className="rounded-2xl bg-white border shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Private CRM</p><h2 className="text-2xl font-bold text-[#1A365D]">📅 Seasonal Demand Engine</h2><p className="text-sm text-slate-500 mt-1">Month-wise listing priority for sales planning. Existing inventory is not changed.</p></div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="border rounded-xl px-3 py-2 font-semibold">{plan.map((p) => <option key={p[0]}>{p[0]}</option>)}</select>
      </div>
      <div className="grid md:grid-cols-3 gap-3 mt-5">
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Priority</p><p className="text-xl font-bold mt-1">{current[2]}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Property focus</p><p className="font-bold mt-1">{current[1]}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Buyer focus</p><p className="font-bold mt-1">{current[3]}</p></div>
      </div>
      <div className="overflow-x-auto mt-5"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-2">Month</th><th>Focus</th><th>Priority</th></tr></thead><tbody>{plan.map((p) => <tr key={p[0]} className="border-b last:border-0"><td className="py-2 font-semibold">{p[0]}</td><td>{p[1]}</td><td>{p[2]}</td></tr>)}</tbody></table></div>
      <p className="text-xs text-slate-500 mt-4">Planning weights are editable later and should be refined using actual CRM lead/site-visit/closure data rather than treated as guaranteed market forecasts.</p>
    </div>
  </section>;
}
