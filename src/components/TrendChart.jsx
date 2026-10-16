import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { TrendingUp } from 'lucide-react';
import { useSensor } from '../context/SensorContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const METRICS = {
  temperature: { label: 'Temperature', unit: '°C', color: '#fbbf24', limit: 35 },
  smoke: { label: 'Smoke', unit: '', color: '#38bdf8', limit: 300 },
  vibration: { label: 'Shaking', unit: 'g', color: '#c084fc', limit: null },
};
const MAX_POINTS = 60;

export default function TrendChart() {
  const { floors, activeFloor } = useSensor();
  const [metric, setMetric] = useState('temperature');
  const buffers = useRef({ 0: [], 1: [], 2: [] });
  const [, setTick] = useState(0);

  // Remember the last 60 readings of each floor
  useEffect(() => {
    floors.slice(0, 3).forEach((f) => {
      const buf = buffers.current[f.id];
      if (!buf) return;
      buf.push({ temperature: f.temperature, smoke: f.smoke ?? 0, vibration: f.vibration });
      if (buf.length > MAX_POINTS) buf.shift();
    });
    setTick((n) => n + 1);
  }, [floors]);

  const m = METRICS[metric];
  const isLive = activeFloor.id <= 2;
  const points = isLive ? buffers.current[activeFloor.id] || [] : [];
  const values = points.map((p) => p[metric]);
  const latest = values.length ? values[values.length - 1] : '—';

  const data = {
    labels: points.map((_, i) => i),
    datasets: [
      {
        data: values,
        borderColor: m.color,
        backgroundColor: `${m.color}22`,
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
      },
      ...(m.limit
        ? [{ data: points.map(() => m.limit), borderColor: '#f87171', borderDash: [4, 4], borderWidth: 1, pointRadius: 0, fill: false }]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true, displayColors: false } },
    scales: {
      x: { display: false },
      y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#64748b', font: { size: 9 } } },
    },
  };

  const tab = (key) =>
    `lift rounded-lg px-2 py-1 text-[10px] font-semibold ${
      metric === key ? 'bg-cyan-500/25 text-cyan-300' : 'text-slate-400 hover:bg-white/10'
    }`;

  return (
    <div className="rise rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
          <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
          <span>Live trend</span>
        </h2>
        <span className="font-mono text-[10px] text-slate-300">
          {activeFloor.code} · {latest}
          {latest === '—' ? '' : m.unit}
        </span>
      </div>

      <div className="mb-2 flex gap-1">
        {Object.entries(METRICS).map(([key, v]) => (
          <button key={key} className={tab(key)} onClick={() => setMetric(key)}>
            {v.label}
          </button>
        ))}
      </div>

      {isLive ? (
        <div className="h-28 w-full">
          <Line data={data} options={options} />
        </div>
      ) : (
        <p className="text-xs text-slate-400">No sensors in this zone yet. Pick Ground, First or Second Floor.</p>
      )}

      <p className="mt-1 text-[9px] text-slate-500">
        Last {points.length} seconds · simulated data{m.limit ? ' · red dashed line = detection limit' : ''}
      </p>
    </div>
  );
}