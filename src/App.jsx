import React, { useState } from 'react';
import { SensorProvider } from './context/SensorContext';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import CenterView from './components/CenterView';
import RightSidebar from './components/RightSidebar';
import ControlPanel from './components/ControlPanel'; import EmergencyOverlay from './components/EmergencyOverlay'; import ConnectionGate from './components/ConnectionGate';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <SensorProvider>
      <div className="w-screen h-screen overflow-hidden bg-[#040810] text-[#e8f4ff] font-sans relative">
        {/* Scanline CRT overlay */}
        <div className="scanlines" />

        {/* Loading Screen */}
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}

        {/* Status banner, drill buttons, alert history */}
        {!isLoading && <ControlPanel />}{!isLoading && <EmergencyOverlay />}{!isLoading && <ConnectionGate />}

        {/* Main Dashboard Layout */}
        <div className={`w-full h-full flex flex-col transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          {/* Top Navbar */}
          <Navbar />

          {/* 3-Column Dashboard Body */}
          <div className="flex-1 flex w-full h-[calc(100vh-56px)] overflow-hidden">
            {/* Left Sidebar (220px) */}
            <LeftSidebar />

            {/* Center Canvas Viewport (Flex 1) */}
            <CenterView />

            {/* Right Sidebar (300px) */}
            <RightSidebar />
          </div>
        </div>
      </div>
    </SensorProvider>
  );
}