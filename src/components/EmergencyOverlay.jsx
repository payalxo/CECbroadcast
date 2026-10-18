import React, { useEffect, useState } from 'react';
import { authedFetch } from '../lib/api';
import { useSensor } from '../context/SensorContext'; import { PeopleSummary } from './PeoplePanel';

const FIRE_STEPS = [
  'Leave the floor now by the nearest exit.',
  'Do not use the lift.',
  'Stay low if there is smoke.',
  'Go to the assembly point and wait for the all-clear.',
  'Call the fire service (101) or 112.',
];
const QUAKE_STEPS = [
  'Drop to your hands and knees.',
  'Take cover under a sturdy desk or table.',
  'Hold on, and stay away from windows.',
  'Do not run outside while the shaking continues.',
  'When it stops, leave carefully by the stairs.',
];

// Runs start() in only ONE open tab at a time, so two tabs never play two sirens.
// start() must return a function that stops whatever it started.
function runInOneTab(name, start) {
  let release = null;
  let stopFn = null;
  let stopped = false;
  const controller = new AbortController();

  const begin = () => {
    stopFn = start();
  };

  if (navigator.locks && navigator.locks.request) {
    navigator.locks
      .request(name, { signal: controller.signal }, () =>
        new Promise((resolve) => {
          if (stopped) {
            resolve();
            return;
          }
          release = resolve;
          begin();
        })
      )
      .catch(() => {});
  } else {
    begin();
  }

  return () => {
    stopped = true;
    controller.abort();
    if (stopFn) {
      try {
        stopFn();
      } catch (e) {
        /* ignore */
      }
    }
    if (release) release();
  };
}

export default function EmergencyOverlay() {
  const { floors, emergency, role } = useSensor();
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const live = floors.slice(0, 3);
  const fireFloors = live.filter((f) => f.status === 'fire').map((f) => f.name);
  const quake = live.some((f) => f.status === 'quake');
  const active = fireFloors.length > 0 || quake;
  const kind = fireFloors.length > 0 ? 'fire' : quake ? 'quake' : '';
  const acked = Boolean(emergency && emergency.acknowledged);
  const escalated = Boolean(emergency && emergency.escalated);
  const seconds = (emergency && emergency.seconds) || 0;
  const escalateAfter = (emergency && emergency.escalate_after) || 60;
  const loud = active && !acked && !muted;

  // When everything is clear again, get ready for the next emergency
  useEffect(() => {
    if (!active) {
      setMuted(false);
      setCollapsed(false);
      setNote('');
    }
  }, [active]);

  // After acknowledging, fold the card away after 4 seconds
  useEffect(() => {
    if (!acked) return undefined;
    const t = setTimeout(() => setCollapsed(true), 4000);
    return () => clearTimeout(t);
  }, [acked]);

  // Siren and spoken announcement: one voice, in one tab only
  useEffect(() => {
    if (!loud) return undefined;

    const announcement =
      kind === 'fire'
        ? `Fire detected on ${fireFloors.join(' and ')}. Leave by the nearest exit. Do not use the lift.`
        : 'Earthquake detected. Drop, cover, and hold on.';

    return runInOneTab('campus-twin-alarm', () => {
      let ctx;
      let osc;
      let timer;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();

        const master = ctx.createGain();
        master.gain.value = 0.12;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2200;
        osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.connect(filter);
        filter.connect(master);
        master.connect(ctx.destination);
        osc.start();

        const cycle = () => {
          const t = ctx.currentTime;
          osc.frequency.cancelScheduledValues(t);
          if (kind === 'fire') {
            // smooth wail: low, up, down
            osc.frequency.setValueAtTime(620, t);
            osc.frequency.linearRampToValueAtTime(1180, t + 0.7);
            osc.frequency.linearRampToValueAtTime(620, t + 1.4);
          } else {
            // earthquake: two-tone beep
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.setValueAtTime(660, t + 0.35);
          }
        };
        cycle();
        timer = setInterval(cycle, kind === 'fire' ? 1400 : 700);
      } catch (e) {
        /* sound is optional */
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(announcement));
      }

      return () => {
        clearInterval(timer);
        try {
          if (osc) osc.stop();
        } catch (e) {
          /* ignore */
        }
        try {
          if (ctx) ctx.close();
        } catch (e) {
          /* ignore */
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      };
    });
  }, [loud, kind]);

  const call = async (path, failText) => {
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      const res = await authedFetch(path, { method: 'POST' });
      if (res.status === 429) setNote('Too many requests. Wait a minute.');
      else if (!res.ok) setNote(failText);
    } catch {
      setNote('Server not reachable.');
    }
    setBusy(false);
  };

  if (!active) return null;

  const theme =
    kind === 'fire'
      ? { border: 'border-red-500/60', card: 'border-red-400/50 bg-red-950/85', title: 'text-red-300', btn: 'bg-red-500 hover:bg-red-400', chip: 'border-red-400/60 bg-red-950/85 text-red-300' }
      : { border: 'border-orange-400/60', card: 'border-orange-400/50 bg-orange-950/85', title: 'text-orange-300', btn: 'bg-orange-400 hover:bg-orange-300', chip: 'border-orange-400/60 bg-orange-950/85 text-orange-300' };

  const steps = kind === 'fire' ? FIRE_STEPS : QUAKE_STEPS;
  const title = kind === 'fire' ? `FIRE: ${fireFloors.join(', ').toUpperCase()}` : 'EARTHQUAKE DETECTED';

  let statusLine = `Escalates in ${Math.max(0, escalateAfter - seconds)} s if not acknowledged`;
  if (acked) statusLine = '✅ Acknowledged by the operator';
  else if (escalated) statusLine = '🚨 ESCALATED: Telegram was notified again';

  return (
    <>
      {!acked && <div className={`pointer-events-none fixed inset-0 z-40 animate-pulse border-4 ${theme.border}`} />}

      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className={`rise lift fixed bottom-[72px] left-2 z-50 flex items-center gap-2 lg:bottom-auto lg:left-[236px] lg:top-[130px] rounded-full border px-4 py-2 text-xs font-bold backdrop-blur-xl ${theme.chip}`}
        >
          <span className={`h-2 w-2 rounded-full bg-current ${acked ? '' : 'animate-pulse'}`} />
          {title}
          {acked ? ' · acknowledged' : ''} · open
        </button>
      ) : (
        <div
          role="alert"
          aria-live="assertive"
          className={`rise fixed bottom-16 left-2 right-2 z-50 max-h-[55dvh] overflow-y-auto lg:bottom-auto lg:left-[236px] lg:right-auto lg:top-[130] lg:max-h-[calc(100vh-170px)] lg:w-80 rounded-2xl border p-4 text-white shadow-2xl backdrop-blur-xl ${theme.card}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`text-base font-extrabold tracking-wide ${theme.title}`}>{title}</p>
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Minimize alert"
              className="lift rounded-lg border border-white/20 bg-white/10 px-2 py-0.5 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-300">Demo announcement. This app does not contact emergency services.</p>
          <p className="mt-2 text-[11px] font-semibold text-slate-100">{statusLine}</p><PeopleSummary />

          <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-slate-100">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap gap-2">
            {!acked && (
              <button
                onClick={() => call('/control/ack', 'Could not acknowledge. Try again.')} hidden={role !== 'operator'}
                disabled={busy}
                className={`lift rounded-xl px-3 py-2 text-xs font-bold text-black disabled:opacity-40 ${theme.btn}`}
              >
                Acknowledge
              </button>
            )}
            {acked && (
              <button
                onClick={() => call('/control/reset', 'Could not clear the drill. Try again.')} hidden={role !== 'operator'}
                disabled={busy}
                className="lift rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold disabled:opacity-40"
              >
                Resolve (clear drill)
              </button>
            )}
            {!acked && (
              <button
                onClick={() => setMuted(!muted)}
                className="lift rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium"
              >
                {muted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
            )}
          </div>
          {note && <p className="mt-2 text-[11px] text-cyan-300">{note}</p>}
        </div>
      )}
    </>
  );
}