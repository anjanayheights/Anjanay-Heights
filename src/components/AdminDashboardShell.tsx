import { useEffect, useState } from 'react';
import LeadDashboard from './LeadDashboard';
import LeadPriorityCenter from './LeadPriorityCenter';
import RevenueCommissionSummary from './RevenueCommissionSummary';
import CommissionCollectionTracker from './CommissionCollectionTracker';
import TodayActionCenter from './TodayActionCenter';
import LeadDealConversion from './LeadDealConversion';
import SmartFollowupPanel from './SmartFollowupPanel';
import CRMAlertBanner from './CRMAlertBanner';
import WebsiteViewerCard from './WebsiteViewerCard';
import SalesPerformanceSnapshot from './SalesPerformanceSnapshot';
import AdvancedSalesPerformance from './AdvancedSalesPerformance';
import PropertyInventory from './PropertyInventory';

const CRM_SESSION_KEY = 'anjanay-heights-crm-password';
const LEGACY_CRM_SESSION_KEY = 'crm_password';

function setControlledInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function getStoredPassword() {
  return sessionStorage.getItem(CRM_SESSION_KEY) || sessionStorage.getItem(LEGACY_CRM_SESSION_KEY) || localStorage.getItem(CRM_SESSION_KEY) || '';
}

function unlockChildPasswordGates(password: string) {
  if (!password) return;
  Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]')).forEach((input) => {
    if (input.value !== password) setControlledInputValue(input, password);
    window.setTimeout(() => {
      input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    }, 60);
  });
}

export default function AdminDashboardShell() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = getStoredPassword();
    if (!stored) return;
    sessionStorage.setItem(CRM_SESSION_KEY, stored);
    sessionStorage.setItem(LEGACY_CRM_SESSION_KEY, stored);
    let cancelled = false;
    fetch('/api/leads?_session=1', { headers: { Authorization: `Bearer ${stored}` }, cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Session expired');
        if (!cancelled) { setPassword(stored); setAuthenticated(true); }
      })
      .catch(() => {
        sessionStorage.removeItem(CRM_SESSION_KEY);
        sessionStorage.removeItem(LEGACY_CRM_SESSION_KEY);
        localStorage.removeItem(CRM_SESSION_KEY);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!authenticated || !password) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      unlockChildPasswordGates(password);
      attempts += 1;
      if (attempts >= 20 || document.querySelectorAll('input[type="password"]').length === 0) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [authenticated, password]);

  async function login() {
    const value = password.trim();
    if (!value) { setError('Please enter CRM password.'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/leads?_login=1', { headers: { Authorization: `Bearer ${value}` }, cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Invalid CRM password');
      sessionStorage.setItem(CRM_SESSION_KEY, value);
      sessionStorage.setItem(LEGACY_CRM_SESSION_KEY, value);
      localStorage.setItem(CRM_SESSION_KEY, value);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open CRM');
    } finally { setLoading(false); }
  }

  function logout() {
    sessionStorage.removeItem(CRM_SESSION_KEY);
    sessionStorage.removeItem(LEGACY_CRM_SESSION_KEY);
    localStorage.removeItem(CRM_SESSION_KEY);
    setAuthenticated(false); setPassword(''); setError('');
  }

  if (!authenticated) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4"><div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Anjanay Heights CRM</h1><p className="text-gray-500 text-center mt-2">Secure single-login dashboard</p><label className="block mt-8 mb-2 font-semibold">CRM Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void login(); }} placeholder="Enter CRM password" className="w-full border rounded-xl px-4 py-3" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button onClick={() => void login()} disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold disabled:opacity-60">{loading ? 'Opening CRM...' : 'Open CRM'}</button></div></div>;

  const nav = [
    ['🎯','Sales Control','/admin/workspace'],['🏠','Inventory','/admin/properties'],['👥','Leads','/admin'],['📅','Follow-ups','/admin/daily-followups'],
    ['📈','Pipeline','/admin/pipeline'],['🎯','Matches','/admin/matches'],['📞','Telecalling','/admin/telecalling'],['🤝','Deals','/admin/deals'],
    ['💰','Revenue','/admin/revenue'],['📊','Management','/admin/management'],['🚀','Lead Generation','/admin/leads-growth'],['🔥','Lead Quality','/admin/lead-quality'],
    ['📅','Seasonal Demand','/admin/seasonal-demand'],['⚙️','Automation','/admin/automation'],['🤖','AI Assistant','/admin/ai'],['👤','Lead 360','/admin/lead-360']
  ];

  return <div className="min-h-screen bg-[#F5F7FA] pb-20 md:pb-0">
    <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur px-3 py-3"><div className="max-w-7xl mx-auto flex items-center justify-between gap-2"><div><p className="text-sm font-semibold text-[#1A365D]">Anjanay Heights CRM</p><p className="text-xs text-gray-500">Single Login · All CRM Modules</p></div><button onClick={logout} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Logout</button></div></div>
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-5"><div className="bg-white rounded-2xl border p-3 mb-5"><div className="flex gap-2 overflow-x-auto pb-1">{nav.slice(0,8).map(([icon,label,url]) => <a key={url} href={url} className="shrink-0 rounded-xl bg-[#F5F7FA] px-3 py-2 text-xs font-semibold text-[#1A365D]">{icon} {label}</a>)}</div><div className="flex gap-2 overflow-x-auto pt-2">{nav.slice(8).map(([icon,label,url]) => <a key={url} href={url} className="shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold text-slate-700">{icon} {label}</a>)}</div></div></div>
    <CRMAlertBanner /><WebsiteViewerCard /><TodayActionCenter /><SmartFollowupPanel /><SalesPerformanceSnapshot /><AdvancedSalesPerformance /><LeadDealConversion /><RevenueCommissionSummary /><CommissionCollectionTracker />
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6"><LeadPriorityCenter /></div><LeadDashboard />
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-2xl font-bold text-[#1A365D]">🏠 Property Inventory</h2><p className="text-sm text-gray-500">Inventory, leads, follow-ups and website visitors are managed from this single CRM login.</p></div><a href="/admin/properties" className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-[#1A365D]">Open Full Inventory →</a></div><div className="rounded-2xl border bg-white overflow-hidden"><PropertyInventory /></div></div>
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/98 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-1 py-2"><div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">{nav.slice(0,5).map(([icon,label,url])=><a key={url} href={url} className="rounded-xl py-2 text-[10px] font-semibold text-[#1A365D] text-center">{icon}<span className="block mt-0.5">{label}</span></a>)}</div></nav>
  </div>;
}