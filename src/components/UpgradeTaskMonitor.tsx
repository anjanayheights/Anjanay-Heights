import { useEffect, useMemo, useState } from 'react';

type Task = { id: string; title: string; detail: string; status: 'done' | 'next' | 'pending'; path?: string };

const TASKS: Task[] = [
  { id: 'lead-alerts', title: 'Lead Alerts', detail: 'Browser push alerts are working.', status: 'done' },
  { id: 'lead-flow', title: 'Website → CRM lead flow', detail: 'Website enquiries are routed to /api/leads.', status: 'done' },
  { id: 'property-cta', title: 'Property CTA mapping', detail: 'Verify property-card enquiry actions use the correct property.', status: 'next', path: '/admin/properties' },
  { id: 'followups', title: 'Follow-up automation', detail: 'Keep follow-up queue and automation aligned with new leads.', status: 'pending', path: '/admin/followup-automation' },
  { id: 'conversion', title: 'Sales conversion upgrades', detail: 'Continue conversion-focused CRM improvements after the pending verification.', status: 'pending', path: '/admin/sales-engine' },
];

export default function UpgradeTaskMonitor() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => Number(localStorage.getItem('ah-upgrade-monitor-seen') || '0'));
  const nextIndex = useMemo(() => TASKS.findIndex((t) => t.status === 'next'), []);
  const next = TASKS[nextIndex] || TASKS.find((t) => t.status === 'pending');
  const completed = TASKS.filter((t) => t.status === 'done').length;

  useEffect(() => {
    const now = Date.now();
    localStorage.setItem('ah-upgrade-monitor-seen', String(now));
    setSeen(now);
  }, []);

  const hasNew = Date.now() - seen > 24 * 60 * 60 * 1000;

  const openTask = (path: string) => {
    setOpen(false);
    window.location.assign(path);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen((v) => !v)} className="fixed right-4 bottom-24 z-[60] rounded-full bg-[#1A365D] px-4 py-3 text-xs font-bold text-white shadow-lg border border-white/20">
        🛠️ CRM Upgrades {hasNew ? '•' : ''}
      </button>
      {open && (
        <aside className="fixed right-4 bottom-40 z-[9999] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C2A36B]">CRM Upgrade Monitor</p><h3 className="mt-1 text-lg font-bold text-[#1A365D]">{completed}/{TASKS.length} tracked</h3></div>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400">✕</button>
          </div>
          <div className="mt-4 space-y-2">
            {TASKS.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><span>{task.status === 'done' ? '✅' : task.status === 'next' ? '🎯' : '⏳'}</span>{task.title}</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{task.detail}</p>
                {task.status !== 'done' && task.path && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      openTask(task.path!);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="relative z-[10000] mt-2 inline-block cursor-pointer touch-manipulation border-0 bg-transparent p-0 text-xs font-bold text-[#1A365D] underline pointer-events-auto"
                  >
                    Open task →
                  </button>
                )}
              </div>
            ))}
          </div>
          {next && <div className="mt-4 rounded-xl bg-[#F5F7FA] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Next priority</p><p className="mt-1 text-sm font-bold text-[#1A365D]">{next.title}</p></div>}
        </aside>
      )}
    </>
  );
}
