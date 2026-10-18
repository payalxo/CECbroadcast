import React from 'react';
import { useSensor } from '../context/SensorContext';
import { Thermometer, Wind, Activity, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
import TrendChart from './TrendChart'; import PeoplePanel from './PeoplePanel';
const CODES = ['GF', '1F', '2F'];

const statusInfo = (s) =>
  s === 'fire'
    ? { label: 'FIRE', tone: 'bg-red-500/25 text-red-300' }
    : s === 'quake'
    ? { label: 'QUAKE', tone: 'bg-orange-400/25 text-orange-300' }
    : { label: 'OK', tone: 'bg-emerald-400/15 text-emerald-300' };

function Tile({ icon, value, unit, label, hot }) {
  return (
    <div
      className={`rounded-xl border p-2 transition-all duration-500 ${
        hot ? 'animate-pulse border-rose-500/40 bg-rose-500/15 text-rose-300' : 'border-white/5 bg-white/5 text-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        {icon}
        <span className={`h-1.5 w-1.5 rounded-full ${hot ? 'bg-rose-500' : 'bg-emerald-400'}`} />
      </div>
      <div className="mt-1 font-mono text-base font-bold">
        {value} <span className="text-[10px]">{unit}</span>
      </div>
      <span className="block text-[9px] text-slate-400">{label}</span>
    </div>
  );
}

export default function RightSidebar() {
  const { activeFloor, healthScore, floors, alerts } = useSensor();

  const live = floors.slice(0, 3);
  const isLiveZone = activeFloor.id <= 2;
  const active = statusInfo(activeFloor.status);
  const realAlerts = alerts.filter((a) => a.type === 'FIRE' || a.type === 'EARTHQUAKE');

  let scoreColor = '#00ff88';
  if (healthScore < 60) scoreColor = '#ff3355';
  else if (healthScore < 80) scoreColor = '#ffaa00';

  const panel = 'rise rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl';
  const heading = 'flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300';

  return (
    <aside className="z-40 flex h-[calc(100vh-56px)] w-[300px] select-none flex-col space-y-4 overflow-y-auto border-l border-white/10 bg-[#070d1a]/70 p-3 backdrop-blur-xl">
      {/* PANEL 1: Building status */}
      <div className={panel}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className={heading}>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Building status</span>
          </h2>
          <span className="rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
            3 FLOORS
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeWidth="3.5"
                strokeDasharray={`${healthScore}, 100`}
                strokeLinecap="round"
                stroke={scoreColor}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-mono text-xl font-extrabold leading-none text-white">{healthScore}</span>
              <span className="text-[8px] uppercase text-slate-400">/100</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 text-[10px]">
            {live.map((f, i) => {
              const s = statusInfo(f.status);
              return (
                <div key={f.id} className="flex items-center justify-between">
                  <span className="text-slate-400">{CODES[i]} · {f.name}</span>
                  <span className={`rounded px-1.5 py-0.5 font-mono font-bold transition-colors duration-500 ${s.tone}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PANEL 2: Live readings for the selected floor */}
      <div className={panel}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Sensor readings</h2>
          <span className="rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
            {activeFloor.code} · {activeFloor.name}
          </span>
        </div>

        {isLiveZone ? (
          <div className="grid grid-cols-2 gap-2">
            <Tile
              icon={<Thermometer className="h-3.5 w-3.5 text-amber-400" />}
              value={activeFloor.temperature}
              unit="°C"
              label="Temperature"
              hot={activeFloor.temperature > 35}
            />
            <Tile
              icon={<Wind className="h-3.5 w-3.5 text-sky-400" />}
              value={activeFloor.smoke ?? '—'}
              unit=""
              label="Smoke level"
              hot={activeFloor.smoke > 300}
            />
            <Tile
              icon={<Activity className="h-3.5 w-3.5 text-purple-400" />}
              value={activeFloor.vibration}
              unit="g"
              label="Shaking"
              hot={activeFloor.status === 'quake'}
            />
            <Tile
              icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
              value={active.label}
              unit=""
              label="Status"
              hot={activeFloor.status === 'fire' || activeFloor.status === 'quake'}
            />
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            No sensors are connected to this zone yet. Pick Ground, First or Second Floor.
          </p>
        )}
      </div>

      <PeoplePanel /><TrendChart />{/* PANEL 3: How detection works */}
      <div className={panel}>
        <h2 className={`${heading} mb-2`}>
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>How detection works</span>
        </h2>
        <div className="space-y-2 text-[10px] text-slate-300">
          <div className="rounded-xl border-l-2 border-red-500 bg-red-500/10 p-2">
            <div className="text-[11px] font-bold text-red-400">Fire</div>
            <p className="mt-0.5">Smoke above 300 and temperature above 35°C at the same time.</p>
          </div>
          <div className="rounded-xl border-l-2 border-orange-400 bg-orange-400/10 p-2">
            <div className="text-[11px] font-bold text-orange-300">Earthquake</div>
            <p className="mt-0.5">Shaking in the last 3 seconds is more than 3 times the normal level of the last 30 seconds.</p>
          </div>
          <p className="text-slate-400">Every alert is sent to Telegram and saved to the alert history.</p>
        </div>
      </div>

      {/* PANEL 4: Alert log */}
      <div className={panel}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className={heading}>
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Alert log</span>
          </h2>
          <span className="font-mono text-[10px] text-slate-400">this session</span>
        </div>
        <div className="max-h-28 space-y-1.5 overflow-y-auto pr-1 font-mono text-[10px]">
          {realAlerts.length === 0 ? (
            <p className="text-slate-500">No alerts yet.</p>
          ) : (
            realAlerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded border border-white/5 bg-black/40 p-1.5">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="truncate text-slate-200">{a.floor} — {a.type}</span>
                </div>
                <span className="ml-1 shrink-0 text-slate-400">{a.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER: Credits */}
      <footer className="border-t border-white/10 pt-2 text-center">
        <p className="text-[9px] leading-tight text-slate-400">
          3D dashboard based on work by <strong className="text-cyan-300">Devendra Gupta</strong> (MIT license)
        </p>
        <p className="mt-0.5 text-[9px] leading-tight text-slate-400">
          Alerts, login and security by <strong className="text-cyan-300">Payal Kumari Mahato</strong>
        </p>
      </footer>
    </aside>
  );
}