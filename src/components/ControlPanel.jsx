import React, { useCallback, useEffect, useState } from 'react';
import { supabase, authedFetch } from '../lib/api';
import { useSensor } from '../context/SensorContext';

const CHIP_LABELS = ['GF', '1F', '2F'];

function timeLabel(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ControlPanel() {
  const { floors } = useSensor();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const live = floors.slice(0, 3);
  const quake = live.some((f) => f.status === 'quake');
  const fireNames = live.filter((f) => f.status === 'fire').map((f) => f.name);

  let banner = { text: 'ALL CLEAR', tone: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', dot: 'bg-emerald-400' };
  if (quake) {
    banner = { text: 'EARTHQUAKE DETECTED', tone: 'border-orange-400/50 bg-orange-400/15 text-orange-300 animate-pulse', dot: 'bg-orange-400' };
  } else if (fireNames.length > 0) {
    banner = { text: `FIRE: ${fireNames.join(', ').toUpperCase()}`, tone: 'border-red-400/50 bg-red-500/15 text-red-300 animate-pulse', dot: 'bg-red-400' };
  }

  const loadHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('id, floor_id, kind, message, created_at')
      .order('created_at', { ascending: false })
      .limit(6);
    if (!error && data) setHistory(data);
  }, []);

  useEffect(() => {
    loadHistory();
    const timer = setInterval(loadHistory, 5000);
    return () => clearInterval(timer);
  }, [loadHistory]);

  const run = async (path) => {
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      const res = await authedFetch(path, { method: 'POST' });
      if (res.status === 429) setNote('Too many drills. Wait a minute.');
      else if (res.status === 401) setNote('Session expired. Please sign in again.');
      else if (!res.ok) setNote('Could not start the drill.');
      else {
        const body = await res.json();
        setNote(body.message || 'Done.');
      }
    } catch {
      setNote('Server not reachable.');
    }
    setBusy(false);
    setTimeout(loadHistory, 4000);
  };

  const glass = 'border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl';
  const btn = 'lift rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-40';
  const chipTone = (status) =>
    status === 'fire' ? 'bg-red-500/30 text-red-200'
    : status === 'quake' ? 'bg-orange-400/30 text-orange-200'
    : 'bg-emerald-400/15 text-emerald-300';

  return (
    <>
      {/* Status banner */}
      <div className="pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2">
        <div className={`flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold tracking-widest backdrop-blur-xl transition-all duration-500 ${banner.tone}`}>
          <span className={`h-2 w-2 rounded-full ${banner.dot}`} />
          {banner.text}
        </div>
      </div>

      {/* Control panel */}
      <div className={`rise fixed left-72 top-36 z-40 w-72 max-h-[70vh] overflow-y-auto rounded-3xl p-4 ${glass}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Control panel</p>
          <div className="flex gap-2">
            <button className={btn} onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</button>
            <button className={btn} onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>

        {open && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              {live.map((f, i) => (
                <span key={f.id} className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors duration-500 ${chipTone(f.status)}`}>
                  {CHIP_LABELS[i]}
                </span>
              ))}
            </div>

            <div>
              <p className="mb-1 text-[11px] uppercase tracking-widest text-slate-400">Simulate (drill)</p>
              <div className="grid grid-cols-3 gap-2">
                <button className={btn} disabled={busy} onClick={() => run('/control/fire/0')}>🔥 GF</button>
                <button className={btn} disabled={busy} onClick={() => run('/control/fire/1')}>🔥 1F</button>
                <button className={btn} disabled={busy} onClick={() => run('/control/fire/2')}>🔥 2F</button>
                <button className={`${btn} col-span-2`} disabled={busy} onClick={() => run('/control/quake')}>🌍 Earthquake</button>
                <button className={btn} disabled={busy} onClick={() => run('/control/reset')}>Reset</button>
              </div>
              {note && <p className="mt-2 text-[11px] text-cyan-300">{note}</p>}
            </div>

            <div>
              <p className="mb-1 text-[11px] uppercase tracking-widest text-slate-400">Alert history</p>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500">No alerts yet.</p>
              ) : (
                <ul className="space-y-1">
                  {history.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-2 text-xs text-slate-300">
                      <span>{a.kind === 'fire' ? '🔥' : '🌍'} {a.message}</span>
                      <span className="shrink-0 text-slate-500">{timeLabel(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}