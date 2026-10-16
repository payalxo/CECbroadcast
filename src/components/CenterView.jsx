import React, { useState, useEffect } from 'react';
import BuildingModel from './BuildingModel';
import { useSensor } from '../context/SensorContext';
import { Eye, Pause, Play, AlertOctagon, Send, Sparkles, X, Compass, Layers } from 'lucide-react';

export default function CenterView() {
  const [cameraPreset, setCameraPreset] = useState(0); // 0: 3D, 1: Plan, 2: Elevation
  const [isPaused, setIsPaused] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [aiResponse, setAiResponse] = useState(null);

  const { floors, selectedFloorId, setSelectedFloorId, latestPopup, setLatestPopup } = useSensor();

  // Auto dismiss alert popup after a few seconds
  useEffect(() => {
    if (latestPopup) {
      const timer = setTimeout(() => setLatestPopup(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [latestPopup, setLatestPopup]);

  // Answers use only the real simulated sensors: temperature, smoke, shaking, status
  const answer = (text) => {
    const q = text.toLowerCase();
    const live = floors.filter((f) => f.id <= 2);
    const top = (key) => [...live].sort((a, b) => (b[key] || 0) - (a[key] || 0))[0];

    if (q.includes('temp') || q.includes('hot') || q.includes('heat') || q.includes('warm')) {
      const f = top('temperature');
      return `Hottest floor: ${f.name} at ${f.temperature}°C.`;
    }
    if (q.includes('smoke')) {
      const f = top('smoke');
      return `Highest smoke level: ${f.name} at ${f.smoke ?? 'no reading yet'}.`;
    }
    if (q.includes('shak') || q.includes('quake') || q.includes('vibrat') || q.includes('earth')) {
      const f = top('vibration');
      return `Strongest shaking: ${f.name} at ${f.vibration} g.`;
    }
    if (q.includes('fire') || q.includes('alert') || q.includes('alarm') || q.includes('status') || q.includes('safe') || q.includes('ok')) {
      const fires = live.filter((f) => f.status === 'fire').map((f) => f.name);
      const quake = live.some((f) => f.status === 'quake');
      if (fires.length === 0 && !quake) return 'All clear. No fire or earthquake is detected on any floor.';
      const parts = [];
      if (fires.length > 0) parts.push(`fire on ${fires.join(', ')}`);
      if (quake) parts.push('earthquake shaking detected');
      return `Alarm: ${parts.join(' and ')}.`;
    }
    return 'I can only answer about temperature, smoke, shaking and fire status. This data is simulated, and there are no sensors for CO2, people or energy.';
  };

  const handleAsk = (e) => {
    e.preventDefault();
    const text = queryInput.trim().slice(0, 120);
    if (!text) return;
    setAiResponse(answer(text));
    setQueryInput('');
  };

  const tab = (active) =>
    `lift flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
      active ? 'bg-cyan-500 text-black shadow-[0_0_10px_#22d3ee]' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <main className="relative h-[calc(100vh-56px)] flex-1 overflow-hidden bg-[#040810]">
      {/* 3D CANVAS */}
      <BuildingModel cameraPreset={cameraPreset} isPaused={isPaused} />

      {/* VIEW BUTTONS (TOP-LEFT) */}
      <div className="absolute left-4 top-4 z-20 flex items-center space-x-2">
        <div className="flex items-center space-x-1 rounded-2xl border border-white/10 bg-white/5 p-1 shadow-lg backdrop-blur-xl">
          <button onClick={() => setCameraPreset(0)} className={tab(cameraPreset === 0)}>
            <Compass className="h-3.5 w-3.5" />
            <span>3D View</span>
          </button>
          <button onClick={() => setCameraPreset(1)} className={tab(cameraPreset === 1)}>
            <Layers className="h-3.5 w-3.5" />
            <span>Floor Plan</span>
          </button>
          <button onClick={() => setCameraPreset(2)} className={tab(cameraPreset === 2)}>
            <Eye className="h-3.5 w-3.5" />
            <span>Front Elevation</span>
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Resume rotation' : 'Pause rotation'}
            className={`lift rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              isPaused ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* FLOOR TAGS (TOP-RIGHT) */}
      <div className="hidden">
        {[
          { id: 2, label: '2F · Classrooms & Computer Lab' },
          { id: 1, label: '1F · Structural & Concrete Labs' },
          { id: 0, label: 'GF · Reception & HOD Office' },
        ].map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedFloorId(tag.id)}
            className={`lift rounded-xl border px-3 py-1.5 text-right text-xs font-semibold shadow-md backdrop-blur-xl ${
              selectedFloorId === tag.id
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* ALERT POPUP (BOTTOM-CENTER) */}
      {latestPopup && (
        <div className="rise absolute bottom-20 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
          <div className="flex items-start space-x-3 rounded-2xl border border-rose-500/50 bg-rose-950/80 p-3.5 text-white shadow-[0_0_30px_rgba(255,51,85,0.4)] backdrop-blur-xl">
            <AlertOctagon className="mt-0.5 h-6 w-6 shrink-0 animate-pulse text-rose-400" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">{latestPopup.type}</span>
                <span className="font-mono text-[10px] text-rose-300/70">{latestPopup.time}</span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-200">{latestPopup.msg}</p>
            </div>
            <button onClick={() => setLatestPopup(null)} aria-label="Dismiss alert" className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ASK THE BUILDING (BOTTOM-RIGHT) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 w-full max-w-lg sm:left-auto">
        {aiResponse && (
          <div className="rise relative mb-2 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-xs text-slate-200 shadow-xl backdrop-blur-xl">
            <button onClick={() => setAiResponse(null)} aria-label="Close answer" className="absolute right-2 top-2 text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start space-x-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
              <div className="pr-4 leading-relaxed">{aiResponse}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleAsk} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={120}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask the building: Which floor is hottest?"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-400 shadow-lg outline-none backdrop-blur-xl transition focus:border-cyan-400/60 focus:bg-white/10"
            />
            <Sparkles className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-cyan-400 opacity-60" />
          </div>
          <button
            type="submit"
            className="lift flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-xs font-semibold text-black"
          >
            <span>Ask</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </main>
  );
}