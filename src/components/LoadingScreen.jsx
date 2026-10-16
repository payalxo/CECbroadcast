import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Database, Activity, Layers, Radio } from 'lucide-react';

const loadingSteps = [
  'Connecting to IoT sensor network...',
'Loading the 3D building model...',
  'Initializing fire and earthquake rules...',
  'Calibrating real-time IoT data streams...',
  'Starting fire and earthquake detection...',
  'Chaibasa Engineering College Digital Twin online.'
];

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 3 second timer for progress from 0 to 100
    const duration = 3000;
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              onComplete();
            }, 600);
          }, 300);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Cycle status text step
    const stepTimer = setInterval(() => {
      setStepIndex(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[1000] bg-[#040810] flex flex-col items-center justify-center transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.08)_0,transparent_70%)] pointer-events-none" />

      <div className="z-10 max-w-xl w-full px-6 flex flex-col items-center text-center">
        {/* Animated Cyber Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-400/40 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(0,212,255,0.3)] animate-pulse">
            <Layers className="w-10 h-10 text-cyan-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 animate-ping" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight whitespace-nowrap bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm mb-2">
          CHAIBASA ENGINEERING COLLEGE
        </h1>
        <h2 className="text-lg font-semibold text-cyan-400 tracking-wider mb-2">
          CAMPUS TWIN · FIRE &amp; EARTHQUAKE MONITORING
        </h2>

       {/* Subtitle & Credits */}
       <p className="text-xs text-slate-400 tracking-wide mb-8 max-w-xl mx-auto text-center leading-relaxed">
          Department of Civil Engineering | Jharkhand University of Technology (JUT), Ranchi
           <span className="block text-cyan-300/80 font-medium mt-2">
             3D Dashboard: Devendra Gupta • Alerts & Security: Payal Kumari Mahato
           </span>
       </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-[#070d1a] p-1 rounded-full border border-cyan-500/20 shadow-inner mb-4 relative overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 transition-all duration-75 shadow-[0_0_12px_rgba(0,212,255,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage and Step Status */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-6">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-spin" />
            <span>{loadingSteps[stepIndex]}</span>
          </div>
          <span className="font-bold text-cyan-300">{Math.round(progress)}%</span>
        </div>

        {/* Publication Credential Badge */}
        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur text-[11px] text-slate-300 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Fire &amp; earthquake monitoring demo</span>
        </div>
      </div>
    </div>
  );
}
