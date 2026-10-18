import React, { useState, useEffect } from 'react';
import { Layers, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { useSensor } from '../context/SensorContext';

export default function Navbar() {
  const { criticalCount, warningCount } = useSensor();
  const [timeStr, setTimeStr] = useState('');

  const totalAlerts = criticalCount + warningCount;

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toTimeString().split(' ')[0]);
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="z-50 flex h-[56px] w-full shrink-0 select-none items-center justify-between gap-2 border-b border-white/10 bg-[#070d1a]/80 px-3 backdrop-blur-xl sm:px-4">
      {/* LEFT: Branding */}
      <div className="flex min-w-0 items-center space-x-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 p-0.5 shadow-[0_0_18px_rgba(34,211,238,0.35)]">
          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#040810]">
            <Layers className="h-5 w-5 text-cyan-400" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-wide text-white">
            CEC Civil Dept <span className="gradient-text">· Campus Twin</span>
          </h1>
          <p className="hidden truncate text-[10px] text-slate-400 sm:block">Chaibasa Engineering College · JUT Ranchi</p>
        </div>
      </div>

      {/* CENTER: Status chips (large screens) */}
      <div className="hidden items-center space-x-3 lg:flex">
        <div className="flex items-center space-x-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <span className="text-[10px] font-bold tracking-wider text-amber-300">SIMULATED DATA</span>
        </div>

        <div
          className={`flex items-center space-x-2 rounded-lg border px-3 py-1 text-xs transition-colors duration-500 ${
            totalAlerts > 0
              ? 'animate-pulse border-rose-500/40 bg-rose-500/15 text-rose-300'
              : 'border-white/10 bg-white/5 text-slate-300'
          }`}
        >
          <AlertTriangle className={`h-3.5 w-3.5 ${totalAlerts > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          <span className="font-mono">
            <strong className={totalAlerts > 0 ? 'text-rose-400' : 'text-white'}>{totalAlerts}</strong> Alerts
          </span>
        </div>

        <div className="flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs">
          <Clock className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-mono font-bold tracking-wider text-cyan-300">{timeStr}</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex shrink-0 items-center">
        {/* phones: short label */}
        <div className="flex items-center space-x-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 sm:hidden">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <span className="text-[10px] font-bold tracking-wider text-amber-300">SIMULATED</span>
        </div>
        {/* tablets and up */}
        <div className="hidden items-center space-x-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-cyan-300 sm:flex">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-[11px] font-medium text-white">Fire &amp; Earthquake Monitoring</span>
        </div>
      </div>
    </header>
  );
}