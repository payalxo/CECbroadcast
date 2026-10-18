import React, { useCallback, useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { supabase, authedFetch } from '../lib/api';
import { useSensor } from '../context/SensorContext';

const CHIP_LABELS = ['GF', '1F', '2F'];

function stamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function icon(a) {
  if (String(a.message).startsWith('Escalated')) return '🚨';
  return a.kind === 'fire' ? '🔥' : '🌍';
}

export default function ControlPanel() {
  const { floors, emergency, role } = useSensor();
  const [open, setOpen] = useState(false);              // laptop: panel expanded
  const [mobileOpen, setMobileOpen] = useState(false);  // phone: dropdown open
  const [history, setHistory] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const live = floors.slice(0, 3);
  const quake = live.some((f) => f.status === 'quake');
  const fireFloors = live.filter((f) => f.status === 'fire');
  const fireNames = fireFloors.map((f) => f.name);
  const fireCodes = fireFloors.map((f) => CHIP_LABELS[f.id]);

  let banner = { text: 'ALL CLEAR', short: 'ALL CLEAR', tone: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', dot: 'bg-emerald-400' };
  if (quake) {
    banner = { text: 'EARTHQUAKE DETECTED', short: 'EARTHQUAKE', tone: 'border-orange-400/50 bg-orange-400/15 text-orange-300 animate-pulse', dot: 'bg-orange-400' };
  } else if (fireNames.length > 0) {
    banner = { text: `FIRE: ${fireNames.join(', ').toUpperCase()}`, short: `FIRE ${fireCodes.join(', ')}`, tone: 'border-red-400/50 bg-red-500/15 text-red-300 animate-pulse', dot: 'bg-red-400' };
  }

  const loadHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('id, floor_id, kind, message, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) setHistory(data);
  }, []);

  // Refresh every 5 seconds
  useEffect(() => {
    loadHistory();
    const timer = setInterval(loadHistory, 5000);
    return () => clearInterval(timer);
  }, [loadHistory]);

  // Refresh soon after anything changes (the server saves alerts a moment after detecting them)
  const changeKey = `${quake}|${fireNames.join(',')}|${emergency ? emergency.escalated : ''}`;
  useEffect(() => {
    const t = setTimeout(loadHistory, 2500);
    return () => clearTimeout(t);
  }, [changeKey, loadHistory]);

  const run = async (path) => {
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      const res = await authedFetch(path, { method: 'POST' });
      if (res.status === 429) setNote('Too many drills. Wait a minute.');
      else if (res.status === 401) setNote('Session expired. Please sign in again.');
      else if (res.status === 403) setNote('Only operators can run drills.');
      else if (!res.ok) setNote('Could not start the drill.');
      else {
        const body = await res.json();
        setNote(body.message || 'Done.');
        // on phones, get the panel out of the way so the building is visible
        if (window.innerWidth < 1024) setMobileOpen(false);
      }
    } catch {
      setNote('Server not reachable.');
    }
    setBusy(false);
  };

  const glass = 'border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl';
  const btn = 'lift rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-40';
  const chipTone = (status) =>
    status === 'fire' ? 'bg-red-500/30 text-red-200'
    : status === 'quake' ? 'bg-orange-400/30 text-orange-200'
    : 'bg-emerald-400/15 text-emerald-300';

  // The content is the same on phones and laptops
  const body = (
    <div className="space-y-3">
      <div className="flex gap-2">
        {live.map((f, i) => (
          <span key={f.id} className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors duration-500 ${chipTone(f.status)}`}>
            {CHIP_LABELS[i]}
          </span>
        ))}
      </div>

      <div>
        <p className="mb-1 text-[11px] uppercase tracking-widest text-slate-400">
          {role === 'operator' ? 'Simulate (drill)' : 'View-only account (drills are for operators)'}
        </p>
        {role === 'operator' && (
          <div className="grid grid-cols-3 gap-2">
            <button className={btn} disabled={busy} onClick={() => run('/control/fire/0')}>🔥 GF</button>
            <button className={btn} disabled={busy} onClick={() => run('/control/fire/1')}>🔥 1F</button>
            <button className={btn} disabled={busy} onClick={() => run('/control/fire/2')}>🔥 2F</button>
            <button className={`${btn} col-span-2`} disabled={busy} onClick={() => run('/control/quake')}>🌍 Earthquake</button>
            <button className={btn} disabled={busy} onClick={() => run('/control/reset')}>Reset</button>
          </div>
        )}
        {note && <p className="mt-2 text-[11px] text-cyan-300">{note}</p>}
      </div>

      <div>
        <p className="mb-1 text-[11px] uppercase tracking-widest text-slate-400">
          Alert history <span className="normal-case tracking-normal text-slate-500">(latest 20)</span>
        </p>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">No alerts yet.</p>
        ) : (
          <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
            {history.map((a) => (
              <li key={a.id} className="text-xs text-slate-300">
                <div>{icon(a)} {a.message}</div>
                <div className="text-[10px] text-slate-500">{stamp(a.created_at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Status banner: small and left-aligned on phones, centered on laptops */}
      <div className="pointer-events-none fixed left-3 top-[116px] z-40 lg:left-1/2 lg:top-16 lg:-translate-x-1/2">
        <div className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-semibold tracking-widest backdrop-blur-xl transition-all duration-500 lg:px-5 lg:py-2 lg:text-xs ${banner.tone}`}>
          <span className={`h-2 w-2 rounded-full ${banner.dot}`} />
          <span className="lg:hidden">{banner.short}</span>
          <span className="hidden lg:inline">{banner.text}</span>
        </div>
      </div>

      {/* Phones: small Controls button and a dropdown */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        className={`lift fixed right-3 top-[74px] z-40 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 lg:hidden ${glass}`}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
        Controls
      </button>

      {mobileOpen && (
        <div className={`rise fixed right-3 top-[122px] z-[70] max-h-[calc(100dvh-190px)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl p-4 lg:hidden ${glass}`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Control panel</p>
            <button className={btn} onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
          {body}
        </div>
      )}

      {/* Laptops: floating panel at the top right of the 3D view */}
      <div className={`rise fixed right-[316px] top-20 z-40 hidden max-h-[75vh] w-72 overflow-y-auto rounded-3xl p-4 lg:block ${glass}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Control panel</p>
          <div className="flex gap-2">
            <button className={btn} onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</button>
            <button className={btn} onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
        {open && <div className="mt-3">{body}</div>}
      </div>
    </>
  );
}