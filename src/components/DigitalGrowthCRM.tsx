import { useEffect, useState } from 'react';

export default function DigitalGrowthCRM() {
  const [password, setPassword] = useState(() => sessionStorage.getItem('crm_password') || '');
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function authorize() {
    if (!password.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/leads?_session=1', { headers: { Authorization: `Bearer ${password.trim()}` }, cache: 'no-store' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data.error || 'CRM authorization required');
      sessionStorage.setItem('crm_password', password.trim());
      sessionStorage.setItem('anjanay-heights-crm-password', password.trim());
      setAuthorized(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to authorize CRM'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (password) void authorize(); }, []);

  if (!authorized) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4"><form onSubmit={e => { e.preventDefault(); void authorize(); }} className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-md"><p className="text-xs font-bold uppercase tracking-wider text-[#1A365D]">Private CRM</p><h1 className="text-3xl font-bold mt-2">Digital Growth</h1><p className="text-gray-500 mt-2">Internal Meta Ads, Google Ads and lead-generation performance. This area is not customer-facing.</p><input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="CRM password" className="w-full border rounded-xl px-4 py-3 mt-6"/><button disabled={loading} className="w-full mt-3 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Authorizing…' : 'Open Digital Growth'}</button>{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<a href="/admin/workspace" className="block text-center mt-4 text-sm font-semibold text-[#1A365D]">← Back to Sales Control Center</a></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8"><div className="max-w-7xl mx-auto"><a href="/admin/workspace" className="text-sm font-semibold text-[#1A365D]">← Sales Control Center</a><div className="mt-3 mb-6"><h1 className="text-3xl font-bold text-[#1A365D]">📈 Digital Growth</h1><p className="text-gray-500 mt-1">Private internal marketing and lead-generation control center.</p></div><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"><a href="/admin/leads-growth" className="bg-white rounded-2xl border p-5 hover:shadow-md"><b>🎯 Lead Generation</b><p className="text-sm text-gray-500 mt-2">Campaign-driven lead acquisition and growth actions.</p></a><a href="/admin/campaign-performance" className="bg-white rounded-2xl border p-5 hover:shadow-md"><b>📊 Campaign Performance</b><p className="text-sm text-gray-500 mt-2">Meta Ads and Google Ads campaign performance.</p></a><a href="/admin/source-analytics" className="bg-white rounded-2xl border p-5 hover:shadow-md"><b>🔎 Source Analytics</b><p className="text-sm text-gray-500 mt-2">Track where leads are coming from.</p></a><a href="/admin/source-funnel" className="bg-white rounded-2xl border p-5 hover:shadow-md"><b>📈 Conversion Funnel</b><p className="text-sm text-gray-500 mt-2">Measure lead-to-conversion performance.</p></a></div><div className="mt-6 bg-white rounded-2xl border p-6"><h2 className="text-xl font-bold text-[#1A365D]">Internal use only</h2><p className="text-sm text-gray-600 mt-2">Digital marketing metrics are kept inside the CRM. Customers see property inventory, enquiries, site visits and contact options—not internal campaign strategy or performance data.</p></div></div></div>;
}
