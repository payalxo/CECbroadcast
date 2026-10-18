import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { authedFetch } from '../lib/api';
import { useSensor } from '../context/SensorContext';

const CODES = ['GF', '1F', '2F'];
const NAMES = ['Ground Floor', 'First Floor', 'Second Floor'];
const EMPTY = { inside: 0, base: 1, settled: true, cleared: false };

function readPeople(emergency) {
  const p = emergency && emergency.people;
  if (!p || !p.floors) return null;
  return [0, 1, 2].map((i) => ({ i, ...(p.floors[String(i)] || EMPTY) }));
}

// One short block, shown inside the red emergency card
export function PeopleSummary() {
  const { emergency } = useSensor();
  const rows = readPeople(emergency);
  if (!rows || !(emergency && emergency.active)) return null;

  const inside = rows.reduce((s, r) => s + r.inside, 0);
  const trapped = rows.filter((r) => r.settled && r.inside > 0).reduce((s, r) => s + r.inside, 0);

  return (
    <div className="mt-2 rounded-xl border border-white/15 bg-black/30 p-2 text-[11px] text-slate-100">
      <div className="font-semibold">
        People inside (simulated): {rows.map((r) => `${CODES[r.i]} ${r.inside}`).join(' · ')}
      </div>
      {trapped > 0 ? (
        <div className="mt-0.5 font-bold text-amber-300">⚠ Possibly trapped: {trapped}. Check these floors first.</div>
      ) : inside === 0 ? (
        <div className="mt-0.5 text-emerald-300">Everyone is out.</div>
      ) : (
        <div className="mt-0.5 text-slate-300">Evacuating…</div>
      )}
    </div>
  );
}

// The full panel, shown in the right sidebar
export default function PeoplePanel() {
  const { emergency, role } = useSensor();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const rows = readPeople(emergency);
  if (!rows) return null;

  const active = Boolean(emergency && emergency.active);
  const total = rows.reduce((s, r) => s + r.inside, 0);

  const clearFloor = async (i) => {
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      const res = await authedFetch(`/control/clear/${i}`, { method: 'POST' });
      if (res.status === 403) setNote('Only operators can mark floors as cleared.');
      else if (res.status === 429) setNote('Too many requests. Wait a minute.');
      else if (!res.ok) setNote('Could not mark the floor as cleared.');
    } catch {
      setNote('Server not reachable.');
    }
    setBusy(false);
  };

  const label = (r) => {
    if (!active) return { text: 'normal', tone: 'text-emerald-300' };
    if (r.cleared) return { text: '✅ cleared', tone: 'text-emerald-300' };
    if (r.inside === 0) return { text: 'empty', tone: 'text-emerald-300' };
    if (r.settled) return { text: 'POSSIBLY TRAPPED', tone: 'text-amber-300' };
    return { text: 'evacuating', tone: 'text-cyan-300' };
  };

  return (
    <div className="rise rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
          <Users className="h-3.5 w-3.5 text-cyan-400" />
          <span>People inside</span>
        </h2>
        <span className="font-mono text-[10px] text-slate-300">{total} in total</span>
      </div>

      <div className="space-y-2">
        {rows.map((r) => {
          const l = label(r);
          const pct = Math.min(100, Math.round((r.inside / Math.max(r.base, 1)) * 100));
          const trapped = active && r.settled && r.inside > 0 && !r.cleared;
          return (
            <div
              key={r.i}
              className={`rounded-xl border p-2 transition-colors duration-500 ${
                trapped ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/5 bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300">{CODES[r.i]} · {NAMES[r.i]}</span>
                <span className={`font-mono font-bold ${l.tone}`}>{l.text}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="w-8 font-mono text-lg font-bold text-white">{r.inside}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                {trapped && role === 'operator' && (
                  <button
                    onClick={() => clearFloor(r.i)}
                    disabled={busy}
                    className="lift rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-semibold disabled:opacity-40"
                  >
                    Floor cleared
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {note && <p className="mt-2 text-[11px] text-cyan-300">{note}</p>}
      <p className="mt-2 text-[9px] leading-snug text-slate-500">
        Simulated headcount: counts only, no names. A real system would use door counters or badge readers and needs a privacy review.
      </p>
    </div>
  );
}