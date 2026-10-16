import React from 'react';
import { useSensor } from '../context/SensorContext';
import { Building2, FlaskConical, Ruler, Zap, Droplets, Wind, Activity, Shield } from 'lucide-react';

const zoneIcons = [
  <Building2 className="h-4 w-4 text-cyan-400" />,
  <FlaskConical className="h-4 w-4 text-blue-400" />,
  <Ruler className="h-4 w-4 text-amber-400" />,
  <Zap className="h-4 w-4 text-yellow-400" />,
  <Droplets className="h-4 w-4 text-emerald-400" />,
  <Wind className="h-4 w-4 text-sky-400" />,
];

const dotFor = (status) =>
  status === 'fire'
    ? 'bg-rose-500 animate-ping shadow-[0_0_10px_#ff3355]'
    : status === 'quake'
    ? 'bg-orange-400 animate-ping shadow-[0_0_10px_#fb923c]'
    : 'bg-emerald-400 shadow-[0_0_8px_#00ff88]';

export default function LeftSidebar() {
  const { selectedFloorId, setSelectedFloorId, floors } = useSensor();

  const live = floors.filter((f) => f.id <= 2);
  const planned = floors.filter((f) => f.id > 2 && f.id <= 5);

  const alarms = live.filter((f) => f.status === 'fire' || f.status === 'quake').length;
  const hottest = Math.max(...live.map((f) => f.temperature));
  const smokePeak = Math.max(...live.map((f) => f.smoke || 0));
  const shakePeak = Math.max(...live.map((f) => f.vibration || 0));

  const card = 'rounded-lg border border-white/5 bg-white/5 p-2';
  const label = 'block text-[9px] uppercase text-slate-400';

  return (
    <aside className="z-40 flex h-[calc(100vh-56px)] w-[220px] select-none flex-col justify-between overflow-y-auto border-r border-white/10 bg-[#070d1a]/70 p-3 backdrop-blur-xl">
      <div>
        <div className="mb-2 flex items-center space-x-1.5 px-1">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Building zones</h2>
        </div>

        {/* Zones with sensors */}
        <div className="mb-3 space-y-1.5">
          {live.map((floor, idx) => {
            const isSelected = selectedFloorId === floor.id;
            return (
              <button
                key={floor.id}
                onClick={() => setSelectedFloorId(floor.id)}
                className={`lift flex w-full items-start space-x-2.5 rounded-xl border p-2.5 text-left ${
                  isSelected
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    : 'border-transparent bg-white/5 text-slate-300 hover:border-cyan-500/20 hover:bg-white/10'
                }`}
              >
                <div className="mt-0.5 rounded-lg border border-white/5 bg-black/40 p-1">{zoneIcons[idx]}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-xs font-semibold leading-tight">{floor.name}</span>
                    <span className={`h-2 w-2 rounded-full ${dotFor(floor.status)}`} />
                  </div>
                  <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-400">{floor.subLabel}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Zones without sensors */}
        <p className="mb-1 px-1 text-[9px] uppercase tracking-wider text-slate-500">No sensors yet</p>
        <div className="mb-6 space-y-1.5">
          {planned.map((floor, idx) => (
            <div key={floor.id} className="flex items-center space-x-2.5 rounded-xl border border-transparent bg-white/[0.03] p-2 opacity-50">
              <div className="rounded-lg border border-white/5 bg-black/40 p-1">{zoneIcons[idx + 3]}</div>
              <span className="truncate text-xs text-slate-400">{floor.name}</span>
            </div>
          ))}
        </div>

        <div className="mb-2 flex items-center space-x-1.5 px-1">
          <Shield className="h-3.5 w-3.5 text-cyan-400" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Building summary</h2>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div className={card}>
            <span className={label}>Floors monitored</span>
            <span className="font-mono text-sm font-bold text-cyan-300">{live.length}</span>
          </div>
          <div className={card}>
            <span className={label}>Active alarms</span>
            <span className={`font-mono text-sm font-bold ${alarms > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{alarms}</span>
          </div>
          <div className={card}>
            <span className={label}>Hottest</span>
            <span className="font-mono text-xs font-bold text-amber-300">{hottest}°C</span>
          </div>
          <div className={card}>
            <span className={label}>Smoke peak</span>
            <span className="font-mono text-xs font-bold text-sky-300">{smokePeak}</span>
          </div>
          <div className={card}>
            <span className={label}>Shaking peak</span>
            <span className="font-mono text-xs font-bold text-purple-300">{shakePeak} g</span>
          </div>
          <div className={card}>
            <span className={label}>Data</span>
            <span className="font-mono text-xs font-bold text-amber-300">Simulated</span>
          </div>
        </div>
      </div>
    </aside>
  );
}