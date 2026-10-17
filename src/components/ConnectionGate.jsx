import React, { useEffect, useState } from 'react';
import { useSensor } from '../context/SensorContext';

export default function ConnectionGate() {
  const { serverStatus } = useSensor();
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    if (serverStatus === 'online') {
      setWaited(0);
      return undefined;
    }
    const t = setInterval(() => setWaited((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [serverStatus]);

  if (serverStatus === 'online') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#040810]/90 p-4 backdrop-blur-md"
    >
      <div className="rise w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400" />
        <h2 className="gradient-text text-xl font-bold">Connecting to the server…</h2>
        <p className="mt-2 text-sm text-slate-300">
          The free server sleeps when nobody is using it. Waking it up can take up to a minute.
        </p>
        <p className="mt-3 font-mono text-xs text-slate-500">{waited}s</p>
        {waited >= 90 && (
          <p className="mt-2 text-xs text-amber-300">
            Still not answering. Check your internet connection or reload the page.
          </p>
        )}
      </div>
    </div>
  );
}