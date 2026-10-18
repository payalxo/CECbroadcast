import React, { useState } from 'react';
import { Building2, Compass, Activity } from 'lucide-react';
import { SensorProvider } from './context/SensorContext';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import CenterView from './components/CenterView';
import RightSidebar from './components/RightSidebar';
import ControlPanel from './components/ControlPanel';
import EmergencyOverlay from './components/EmergencyOverlay';
import ConnectionGate from './components/ConnectionGate';

const TABS = [
  { id: 'zones', label: 'Zones', Icon: Building2 },
  { id: 'view', label: '3D View', Icon: Compass },
  { id: 'status', label: 'Status', Icon: Activity },
];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  // On phones only one panel shows at a time; on large screens all three show
  const [tab, setTab] = useState('view');

  return (
    <SensorProvider>
      <div className="relative h-dvh w-screen overflow-hidden bg-[#040810] font-sans text-[#e8f4ff]">
        <div className="scanlines" />

        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}

        {/* Status banner and control panel (phones: only on the 3D tab) */}
        <div className={tab === 'view' ? 'block' : 'hidden lg:block'}>
          {!isLoading && <ControlPanel />}
        </div>
        {!isLoading && <EmergencyOverlay />}
        {!isLoading && <ConnectionGate />}

        <div className={`flex h-full w-full flex-col transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          <Navbar />

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className={`${tab === 'zones' ? 'flex' : 'hidden'} h-full w-full lg:flex lg:w-auto [&>aside]:!h-full [&>aside]:!w-full lg:[&>aside]:!w-[220px]`}>
              <LeftSidebar />
            </div>

            <div className={`${tab === 'view' ? 'flex' : 'hidden'} h-full min-w-0 flex-1 lg:flex [&>main]:!h-full`}>
              <CenterView />
            </div>

            <div className={`${tab === 'status' ? 'flex' : 'hidden'} h-full w-full lg:flex lg:w-auto [&>aside]:!h-full [&>aside]:!w-full lg:[&>aside]:!w-[300px]`}>
              <RightSidebar />
            </div>
          </div>

          {/* Bottom tab bar, phones only */}
          <nav
            className="flex h-14 shrink-0 border-t border-white/10 bg-[#070d1a]/90 backdrop-blur-xl lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                  tab === id ? 'text-cyan-300' : 'text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </SensorProvider>
  );
}