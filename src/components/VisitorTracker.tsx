import { useEffect } from 'react';

const HEARTBEAT_MS = 30_000;

export default function VisitorTracker() {
  useEffect(() => {
    let stopped = false;
    const ping = () => {
      if (stopped) return;
      fetch('/api/visitor', { method: 'POST', keepalive: true, cache: 'no-store', headers: { 'x-page-path': window.location.pathname } }).catch(() => {});
    };
    ping();
    const timer = window.setInterval(ping, HEARTBEAT_MS);
    return () => { stopped = true; window.clearInterval(timer); };
  }, []);
  return null;
}