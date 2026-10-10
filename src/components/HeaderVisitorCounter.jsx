import React, { useEffect, useState } from 'react';
const API_BASE = (import.meta.env.VITE_VISITOR_API_BASE || '').replace(/\/$/, '');
const VISITOR_KEY = 'ti_anon_visitor_v1';
function getAnonymousVisitorId() {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch { return null; }
}
export function HeaderVisitorCounter() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (!API_BASE) { setStatus('unconfigured'); return; }
    let cancelled = false;
    const visitorId = getAnonymousVisitorId();
    const track = async () => {
      try {
        await fetch(`${API_BASE}/api/visitor/track`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ visitorId, path: window.location.pathname + window.location.hash }), keepalive: true });
      } catch { /* Stats may still be readable. */ }
      try {
        const response = await fetch(`${API_BASE}/api/visitor/stats`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Stats unavailable');
        const data = await response.json();
        if (!cancelled) { setStats(data); setStatus('ready'); }
      } catch { if (!cancelled) setStatus('unavailable'); }
    };
    track();
    const refresh = window.setInterval(track, 60000);
    return () => { cancelled = true; window.clearInterval(refresh); };
  }, []);
  const number = value => Number.isFinite(Number(value)) ? new Intl.NumberFormat('hi-IN').format(Number(value)) : '—';
  const title = status === 'unconfigured' ? 'विज़िटर काउंटर कॉन्फ़िगर नहीं है' : status === 'unavailable' ? 'विज़िटर आँकड़े अभी उपलब्ध नहीं हैं' : 'Cloudflare Worker से प्राप्त आँकड़े';
  return <div className="ti-visitor-counter" aria-label="वेबसाइट विज़िटर आँकड़े" title={title}>
    <span className="ti-visitor-stat"><span className="ti-live-dot" aria-hidden="true"/><span className="ti-visitor-label">अभी</span><strong>{status === 'ready' ? number(stats?.activeNow) : '—'}</strong></span>
    <span className="ti-visitor-separator" aria-hidden="true">|</span>
    <span className="ti-visitor-stat"><span className="ti-visitor-label">कुल</span><strong>{status === 'ready' ? number(stats?.totalVisitors) : '—'}</strong></span>
  </div>;
}
