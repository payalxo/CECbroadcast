import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authedFetch } from '../lib/api';

const SensorContext = createContext();

export const initialFloorData = [
  { id: 0, name: 'Ground Floor', subLabel: 'Reception · HOD Office · Staff Room', code: 'GF', temperature: 24.2, humidity: 52, co2: 680, occupancy: 28, energy: 14.5, noise: 48, vibration: 0.12, lux: 450 },
  { id: 1, name: 'First Floor', subLabel: 'Structural Lab · Concrete Lab · Corridor', code: '1F', temperature: 27.8, humidity: 61, co2: 890, occupancy: 35, energy: 22.8, noise: 64, vibration: 0.35, lux: 580 },
  { id: 2, name: 'Second Floor', subLabel: 'Classrooms · Drawing Hall · Computer Lab', code: '2F', temperature: 32.4, humidity: 58, co2: 1480, occupancy: 38, energy: 26.4, noise: 55, vibration: 0.18, lux: 620 },
  { id: 3, name: 'Electrical DB', subLabel: 'Main DB · UPS · Backup Gen', code: 'MEP-E', temperature: 29.5, humidity: 45, co2: 420, occupancy: 2, energy: 18.2, noise: 58, vibration: 0.25, lux: 300 },
  { id: 4, name: 'Plumbing & Water', subLabel: 'OHT · Pump Room · Drainage', code: 'MEP-P', temperature: 23.0, humidity: 78, co2: 450, occupancy: 1, energy: 8.5, noise: 52, vibration: 0.42, lux: 250 },
  { id: 5, name: 'Ventilation HVAC', subLabel: 'Exhaust · Air handlers · Ducting', code: 'MEP-V', temperature: 25.5, humidity: 50, co2: 510, occupancy: 0, energy: 12.1, noise: 68, vibration: 0.31, lux: 350 },
  { id: 6, name: 'Basement & Utility', subLabel: 'Storage · Service Area', code: 'BASE', temperature: 21.0, humidity: 40, co2: 400, occupancy: 0, energy: 3.2, noise: 32, vibration: 0.05, lux: 400 }
];

export function SensorProvider({ children }) {
  const [selectedFloorId, setSelectedFloorId] = useState(0);
  const [floors, setFloors] = useState(initialFloorData);
  const [energyHistory, setEnergyHistory] = useState([78, 81, 85, 83, 89, 94, 91, 95, 98, 102, 104, 101, 99, 105, 103, 106, 108, 105, 107, 105.6]);
  const [alerts, setAlerts] = useState([
    { id: 1, time: '22:15:02', floor: 'Second Floor', type: 'CO2 Anomaly', level: 'critical', msg: 'Classroom CO2 level reached 1480 ppm (Threshold: 1200 ppm)' },
    { id: 2, time: '22:14:30', floor: 'Second Floor', type: 'HVAC Thermal', level: 'warning', msg: 'Ambient temp elevated at 32.4°C in Drawing Hall' },
    { id: 3, time: '22:10:15', floor: 'First Floor', type: 'Vibration Peak', level: 'info', msg: 'Concrete Compression Testing Machine operational in Lab' }
  ]);
  const [latestPopup, setLatestPopup] = useState(null); const [emergency, setEmergency] = useState(null);

  // Is the Python server running? Which status was each floor in last time?
  const serverOnline = useRef(false);
  const lastStatus = useRef({});

  // Ask the Python server for live numbers every second
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await authedFetch('/data');
        const data = await res.json();
        serverOnline.current = true; setEmergency(data.emergency || null);
        const timestamp = new Date().toTimeString().split(' ')[0];

        setFloors(prev => prev.map(f => {
          const live = data.floors?.[String(f.id)];
          if (!live) return f;
          return { ...f, temperature: live.temperature, smoke: live.smoke, vibration: live.vibration, status: live.status, co2: 600 };
        }));

        if (data.floors) {
          Object.entries(data.floors).forEach(([id, live]) => {
            const before = lastStatus.current[id] || 'ok';
            if (live.status !== 'ok' && before === 'ok') {
              const isFire = live.status === 'fire';
              const alertObj = {
                id: Date.now() + Number(id),
                time: timestamp,
                floor: live.name || `Floor ${id}`,
                type: isFire ? 'FIRE' : 'EARTHQUAKE',
                level: 'critical',
                msg: isFire
                  ? `Fire detected on ${live.name || `Floor ${id}`}: smoke ${live.smoke}, temperature ${live.temperature}°C`
                  : `Strong shaking detected on ${live.name || `Floor ${id}`}`
              };
              setAlerts(prevAlerts => [alertObj, ...prevAlerts.slice(0, 15)]);
              setLatestPopup(alertObj);
            }
            lastStatus.current[id] = live.status;
          });
        }
      } catch (e) {
        serverOnline.current = false;
      }
    };

    poll();
    const timer = setInterval(poll, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fake sensor ticker every 2500ms (only used when the Python server is NOT running)
  useEffect(() => {
    const interval = setInterval(() => {
      if (serverOnline.current) return;

      const timestamp = new Date().toTimeString().split(' ')[0];

      setFloors(prevFloors => {
        const updatedFloors = prevFloors.map(floor => {
          if (floor.id === 2) {
            return {
              ...floor,
              co2: Math.floor(1350 + Math.random() * 250),
              temperature: Number((31.0 + Math.random() * 3).toFixed(1)),
              energy: Number((24 + Math.random() * 5).toFixed(1)),
              humidity: Math.floor(52 + Math.random() * 10),
              occupancy: Math.floor(32 + Math.random() * 8),
              noise: Math.floor(52 + Math.random() * 12),
            };
          } else if (floor.id <= 2) {
            return {
              ...floor,
              temperature: Number((22 + Math.random() * 5).toFixed(1)),
              humidity: Math.floor(45 + Math.random() * 20),
              co2: Math.floor(500 + Math.random() * 450),
              occupancy: Math.floor(15 + Math.random() * 20),
              energy: Number((12 + Math.random() * 12).toFixed(1)),
              noise: Math.floor(40 + Math.random() * 25),
              vibration: Number((0.1 + Math.random() * 0.3).toFixed(2)),
            };
          } else {
            return {
              ...floor,
              energy: Number((5 + Math.random() * 15).toFixed(1)),
              temperature: Number((20 + Math.random() * 8).toFixed(1)),
            };
          }
        });

        // Update energy history cleanly without nested state setters
        const totalKW = updatedFloors.reduce((acc, f) => acc + f.energy, 0);
        setEnergyHistory(prev => [...prev.slice(1), Number(totalKW.toFixed(1))]);

        return updatedFloors;
      });

      if (Math.random() > 0.6) {
        const newCo2Val = Math.floor(1450 + Math.random() * 150);
        const alertObj = {
          id: Date.now(),
          time: timestamp,
          floor: 'Second Floor',
          type: 'High CO2 Anomaly',
          level: 'critical',
          msg: `Demo data (server offline): CO2 spike (${newCo2Val} ppm) in 2F Classroom 204`
        };
        setAlerts(prev => [alertObj, ...prev.slice(0, 15)]);
        setLatestPopup(alertObj);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Compute building metrics
  const totalOccupancy = floors.filter(f => f.id <= 2).reduce((acc, f) => acc + f.occupancy, 0);
  const totalEnergy = Number(floors.reduce((acc, f) => acc + f.energy, 0).toFixed(1));
  const avgTemp = Number((floors.slice(0, 3).reduce((acc, f) => acc + f.temperature, 0) / 3).toFixed(1));
  const avgCo2 = Math.round(floors.slice(0, 3).reduce((acc, f) => acc + f.co2, 0) / 3);

  // Compute active anomalies count
  const criticalCount = floors.filter(f => f.co2 > 1300 || f.temperature > 33 || f.vibration > 0.8 || f.status === 'fire' || f.status === 'quake').length;
  const warningCount = floors.filter(f => (f.co2 > 1000 && f.co2 <= 1300) || (f.temperature > 30 && f.temperature <= 33) || f.energy > 28).length;

  // Calculate overall building health score (0-100)
  let healthScore = 100 - (criticalCount * 14) - (warningCount * 6);
  if (healthScore < 35) healthScore = 35;

  const activeFloor = floors.find(f => f.id === selectedFloorId) || floors[0];

  // Natural Language Query Engine
  const answerQuery = (queryText) => {
    const q = queryText.toLowerCase();
    if (q.includes('co2') || q.includes('carbon') || q.includes('air')) {
      const highestCo2Floor = [...floors].sort((a, b) => b.co2 - a.co2)[0];
      return `📊 **Air Quality Analysis**: ${highestCo2Floor.name} currently exhibits the highest CO2 concentration at **${highestCo2Floor.co2} ppm** (Threshold: 1000 ppm). Recommendation: Increase HVAC fresh air damper position on Floor 2.`;
    }
    if (q.includes('temp') || q.includes('heat') || q.includes('hot')) {
      const hottestFloor = [...floors].sort((a, b) => b.temperature - a.temperature)[0];
      return `🌡️ **Thermal Inspection**: ${hottestFloor.name} recorded highest temperature of **${hottestFloor.temperature}°C**. Ambient HVAC setpoint calibration is recommended.`;
    }
    if (q.includes('energy') || q.includes('power') || q.includes('load') || q.includes('kw')) {
      const maxEnergyFloor = [...floors].sort((a, b) => b.energy - a.energy)[0];
      return `⚡ **Power Demand**: Total building electrical load is **${totalEnergy} kW**. Highest consumption is observed in **${maxEnergyFloor.name}** at **${maxEnergyFloor.energy} kW**.`;
    }
    if (q.includes('occup') || q.includes('people') || q.includes('student') || q.includes('headcount')) {
      const gfOcc = floors.find(f => f.id === 0)?.occupancy ?? 0;
      const f1Occ = floors.find(f => f.id === 1)?.occupancy ?? 0;
      const f2Occ = floors.find(f => f.id === 2)?.occupancy ?? 0;
      return `👥 **Occupancy Count**: Current active building headcount is **${totalOccupancy} occupants** across all 3 floors (GF: ${gfOcc}, 1F: ${f1Occ}, 2F: ${f2Occ}).`;
    }
    if (q.includes('alert') || q.includes('anomaly') || q.includes('risk') || q.includes('health')) {
      return `🛡️ **Health & Integrity**: Overall building health score is **${healthScore}/100**. ${criticalCount} Critical and ${warningCount} Warning anomalies active. Primary driver: Second Floor CO2 accumulation.`;
    }
    return `🤖 Building assistant: Live telemetry active across building subsystems and sensory data streams. Structural integrity nominal. High CO2 anomaly detected on 2F Classrooms. Ask about CO2, Temperature, Energy, or Headcount!`;
  };

  return (
    <SensorContext.Provider value={{
      selectedFloorId,
      setSelectedFloorId,
      floors,
      activeFloor,
      totalOccupancy,
      totalEnergy,
      avgTemp,
      avgCo2,
      criticalCount,
      warningCount,
      healthScore,
      energyHistory,
      alerts,
      latestPopup,
      setLatestPopup, emergency,
      answerQuery
    }}>
      {children}
    </SensorContext.Provider>
  );
}

export function useSensor() {
  return useContext(SensorContext);
}