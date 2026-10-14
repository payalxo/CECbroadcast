import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSensor } from '../context/SensorContext';

// Color Palette Tokens
const CREAM_COLOR = '#D5BEA0'; // Facade plaster cream
const RED_BAND_COLOR = '#9B1B1B'; // Accent red band courses
const PARAPET_CREAM = '#C8B092';
const GLASS_COLOR = '#5082A6'; // Deep blue tinted glass
const PATH_COLOR = '#2A2E35'; // Concrete pathway

// Interactive Procedural Building Component
function CECBuilding({ cameraView, isPaused }) {
  const buildingGroup = useRef();
  const scanBeamRef = useRef();
  const { selectedFloorId, floors } = useSensor();

  // Floor status for sensor sphere colors
  const f0Status = floors[0]?.co2 > 1200 ? 'red' : 'green';
  const f1Status = floors[1]?.co2 > 1200 ? 'red' : 'green';
  const f2Status = floors[2]?.co2 > 1300 ? 'red' : floors[2]?.co2 > 1000 ? 'amber' : 'green'; // Floor 2 alert state

  // Continuous subtle rotation & scan beam movement
  useFrame((state, delta) => {
    if (buildingGroup.current && !isPaused) {
      buildingGroup.current.rotation.y += 0.002;
    }

    // Scan beam animation
    if (scanBeamRef.current) {
      const time = state.clock.getElapsedTime();
      scanBeamRef.current.position.y = (Math.sin(time * 1.5) * 6) + 6;
    }
  });

  return (
    <group ref={buildingGroup} position={[0, -4, 0]}>
      {/* ALARM OVERLAY: floor glows red (fire) or orange (earthquake) */}
      {[0, 1, 2].map((i) => {
        const s = floors[i]?.status;
        if (s !== 'fire' && s !== 'quake') return null;
        return (
          <mesh key={`alarm-${i}`} position={[0, [2, 6.5, 11][i], 0]}>
            <boxGeometry args={[37, 4.3, 15]} />
            <meshBasicMaterial color={s === 'fire' ? '#ff1a1a' : '#ff9900'} transparent opacity={0.55} />
          </mesh>
        );
      })}
      {/* GROUND PLANE & CAMPUS LAWN */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0b1e0f" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Grid overlay for digital twin aesthetic */}
      <gridHelper args={[80, 40, '#00d4ff', '#004466']} position={[0, 0.01, 0]} />

      {/* ENTRANCE PATHWAY */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 16]}>
        <planeGeometry args={[6, 20]} />
        <meshStandardMaterial color={PATH_COLOR} roughness={0.8} />
      </mesh>

      {/* ========================================================= */}
      {/* MAIN BUILDING STRUCTURE (G+2 = Ground, 1st, 2nd floors) */}
      {/* ========================================================= */}

      {/* GROUND FLOOR (Height 4 units, Y: 0 to 4) */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[36, 4, 14]} />
        <meshStandardMaterial color={CREAM_COLOR} roughness={0.55} />
      </mesh>

      {/* RED BAND COURSE 1 (Ground floor slab top) */}
      <mesh position={[0, 4.25, 0]}>
        <boxGeometry args={[36.4, 0.5, 14.4]} />
        <meshStandardMaterial color={RED_BAND_COLOR} roughness={0.4} />
      </mesh>

      {/* FIRST FLOOR (Height 4 units, Y: 4.5 to 8.5) */}
      <mesh position={[0, 6.5, 0]}>
        <boxGeometry args={[36, 4, 14]} />
        <meshStandardMaterial color={CREAM_COLOR} roughness={0.55} />
      </mesh>

      {/* RED BAND COURSE 2 (1st floor slab top) */}
      <mesh position={[0, 8.75, 0]}>
        <boxGeometry args={[36.4, 0.5, 14.4]} />
        <meshStandardMaterial color={RED_BAND_COLOR} roughness={0.4} />
      </mesh>

      {/* SECOND FLOOR (Height 4 units, Y: 9 to 13) */}
      <mesh position={[0, 11, 0]}>
        <boxGeometry args={[36, 4, 14]} />
        <meshStandardMaterial color={CREAM_COLOR} roughness={0.55} />
      </mesh>

      {/* RED PARAPET BAND COURSE (Roof top line) */}
      <mesh position={[0, 13.25, 0]}>
        <boxGeometry args={[36.4, 0.5, 14.4]} />
        <meshStandardMaterial color={RED_BAND_COLOR} roughness={0.4} />
      </mesh>

      {/* FLAT ROOF SLAB */}
      <mesh position={[0, 13.6, 0]}>
        <boxGeometry args={[36.6, 0.3, 14.6]} />
        <meshStandardMaterial color={PARAPET_CREAM} roughness={0.6} />
      </mesh>

      {/* ROOF PARAPET WALL */}
      <mesh position={[0, 14.1, 0]}>
        <boxGeometry args={[36.2, 0.7, 14.2]} />
        <meshStandardMaterial color={CREAM_COLOR} roughness={0.5} />
      </mesh>

      {/* ========================================================= */}
      {/* CORNER TOWERS (4 Corner projections with top cutouts)    */}
      {/* ========================================================= */}
      {[
        [-17.5, 7.25, 6.8], // Front Left
        [17.5, 7.25, 6.8],  // Front Right
        [-17.5, 7.25, -6.8], // Back Left
        [17.5, 7.25, -6.8]   // Back Right
      ].map((pos, idx) => (
        <group key={`tower-${idx}`} position={pos}>
          {/* Main Tower Volume (Higher than roof) */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[4.2, 14.5, 4.2]} />
            <meshStandardMaterial color={CREAM_COLOR} roughness={0.5} />
          </mesh>

          {/* Tower Horizontal Red Accent Bands */}
          <mesh position={[0, -3, 0]}>
            <boxGeometry args={[4.4, 0.5, 4.4]} />
            <meshStandardMaterial color={RED_BAND_COLOR} />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[4.4, 0.5, 4.4]} />
            <meshStandardMaterial color={RED_BAND_COLOR} />
          </mesh>
          <mesh position={[0, 6, 0]}>
            <boxGeometry args={[4.4, 0.5, 4.4]} />
            <meshStandardMaterial color={RED_BAND_COLOR} />
          </mesh>

          {/* Tower Top Open Cutout Aperture (Navisworks feature) */}
          <mesh position={[0, 7.8, 0]}>
            <boxGeometry args={[3.2, 2.0, 3.2]} />
            <meshStandardMaterial color="#1a2536" roughness={0.2} metalness={0.8} />
          </mesh>

          {/* Tower Roof Cap */}
          <mesh position={[0, 8.9, 0]}>
            <boxGeometry args={[4.4, 0.3, 4.4]} />
            <meshStandardMaterial color={RED_BAND_COLOR} />
          </mesh>
        </group>
      ))}

      {/* ========================================================= */}
      {/* PROJECTING FACADE WINGS (Left & Right Window Bays)        */}
      {/* ========================================================= */}
      {/* Left Window Bay Wing */}
      <mesh position={[-9, 6.6, 7.3]}>
        <boxGeometry args={[9, 13.2, 0.6]} />
        <meshStandardMaterial color={CREAM_COLOR} roughness={0.5} />
      </mesh>
      {/* Right Window Bay Wing */}
      <mesh position={[9, 6.6, 7.3]}>
        <boxGeometry args={[9, 13.2, 0.6]} />
        <meshStandardMaterial color={CREAM_COLOR} roughness={0.5} />
      </mesh>

      {/* ========================================================= */}
      {/* RECESSED FACADE WINDOW PANES (3 Floors, Symmetrical)      */}
      {/* ========================================================= */}
      {[2, 6.5, 11].map((yPos, fIdx) => (
        <group key={`windows-floor-${fIdx}`}>
          {/* Left Wing Windows (Double large panes) */}
          <mesh position={[-11, yPos, 7.6]}>
            <boxGeometry args={[3.6, 2.6, 0.2]} />
            <meshPhysicalMaterial color={GLASS_COLOR} transparent opacity={0.65} roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[-7, yPos, 7.6]}>
            <boxGeometry args={[3.6, 2.6, 0.2]} />
            <meshPhysicalMaterial color={GLASS_COLOR} transparent opacity={0.65} roughness={0.1} metalness={0.9} />
          </mesh>

          {/* Right Wing Windows (Double large panes) */}
          <mesh position={[7, yPos, 7.6]}>
            <boxGeometry args={[3.6, 2.6, 0.2]} />
            <meshPhysicalMaterial color={GLASS_COLOR} transparent opacity={0.65} roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[11, yPos, 7.6]}>
            <boxGeometry args={[3.6, 2.6, 0.2]} />
            <meshPhysicalMaterial color={GLASS_COLOR} transparent opacity={0.65} roughness={0.1} metalness={0.9} />
          </mesh>

          {/* White Mullion Framing Borders */}
          {[-11, -7, 7, 11].map((xPos, wIdx) => (
            <mesh key={`frame-${fIdx}-${wIdx}`} position={[xPos, yPos, 7.7]}>
              <boxGeometry args={[3.8, 2.8, 0.05]} />
              <meshBasicMaterial color="#ffffff" wireframe />
            </mesh>
          ))}
        </group>
      ))}

      {/* ========================================================= */}
      {/* CENTRAL ENTRANCE PORTICO CANOPY & 3D SIGNAGE              */}
      {/* ========================================================= */}
      {/* Portico Slab projecting forward */}
      <mesh position={[0, 3.8, 9.2]}>
        <boxGeometry args={[10, 0.4, 4.4]} />
        <meshStandardMaterial color={CREAM_COLOR} roughness={0.4} />
      </mesh>

      {/* Front Red Border Edge on Canopy */}
      <mesh position={[0, 3.8, 11.45]}>
        <boxGeometry args={[10.2, 0.45, 0.1]} />
        <meshStandardMaterial color={RED_BAND_COLOR} />
      </mesh>

      {/* Entrance Glass Double Doors */}
      <mesh position={[0, 1.6, 7.1]}>
        <boxGeometry args={[3.2, 3.2, 0.2]} />
        <meshPhysicalMaterial color="#1a354a" transparent opacity={0.85} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* 3D Signage Text on Portico Facade */}
      <Text
        position={[0, 4.25, 11.52]}
        fontSize={0.48}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        DEPT. OF CIVIL ENGINEERING
      </Text>

      <Text
        position={[0, 3.55, 11.52]}
        fontSize={0.26}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        CHAIBASA ENGINEERING COLLEGE · JUT RANCHI
      </Text>

      {/* ========================================================= */}
      {/* FLOOR SELECTION HIGHLIGHT EMISSIVE RING                    */}
      {/* ========================================================= */}
      {selectedFloorId <= 2 && (
        <mesh position={[0, selectedFloorId === 0 ? 2 : selectedFloorId === 1 ? 6.5 : 11, 0]}>
          <boxGeometry args={[37.2, 4.1, 15.2]} />
          <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.8} />
        </mesh>
      )}

      {/* ========================================================= */}
      {/* ANIMATED IoT SENSOR NODES (3 per floor = 9 total)        */}
      {/* ========================================================= */}
      {[
        { id: 0, y: 2, status: f0Status, labels: ['GF-01 Reception', 'GF-02 HOD Office', 'GF-03 Staff Room'] },
        { id: 1, y: 6.5, status: f1Status, labels: ['1F-01 Struct Lab', '1F-02 Concrete Lab', '1F-03 Corridor'] },
        { id: 2, y: 11, status: f2Status, labels: ['2F-01 Class 201', '2F-02 Classroom 204 (CO2 HIGH)', '2F-03 Computer Lab'] }
      ].map((floorSensors) => (
        <group key={`sensors-floor-${floorSensors.id}`}>
          {[-11, 0, 11].map((xOffset, sIdx) => {
            const nodeColor = floorSensors.status === 'red' && floorSensors.id === 2 && sIdx === 1 ? '#ff3355' : floorSensors.status === 'amber' ? '#ffaa00' : '#00ff88';
            return (
              <group key={`sensor-node-${floorSensors.id}-${sIdx}`} position={[xOffset, floorSensors.y, 7.8]}>
                {/* Glowing Core Sphere */}
                <mesh>
                  <sphereGeometry args={[0.35, 16, 16]} />
                  <meshBasicMaterial color={nodeColor} />
                </mesh>

                {/* Orbiting Sensor Ring */}
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                  <ringGeometry args={[0.5, 0.6, 32]} />
                  <meshBasicMaterial color={nodeColor} side={THREE.DoubleSide} transparent opacity={0.7} />
                </mesh>

                {/* Html Sensor Data Hover Tag */}
                <Html position={[0, 0.6, 0]} center distanceFactor={25}>
                  <div className="px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap bg-[#040810]/80 backdrop-blur border border-cyan-500/40 text-cyan-300 shadow-lg pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ backgroundColor: nodeColor }}></span>
                    {floorSensors.labels[sIdx]}
                  </div>
                </Html>
              </group>
            );
          })}
        </group>
      ))}

      {/* ========================================================= */}
      {/* AI SCANNING LASER BEAM SWEEP                             */}
      {/* ========================================================= */}
      <mesh ref={scanBeamRef} position={[0, 6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[42, 20]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

    </group>
  );
}

// Parent 3D Canvas Viewport Component
export default function BuildingModel({ cameraPreset, isPaused }) {
  // Preset Camera angles
  // Preset 0: Isometric 3D (24, 18, 28)
  // Preset 1: Top Floor Plan (0, 38, 0.1)
  // Preset 2: Front Elevation (0, 5, 38)
  const cameraPositions = [
    [24, 18, 28],
    [0, 38, 0.1],
    [0, 5, 38]
  ];

  const currentCamPos = cameraPositions[cameraPreset] || cameraPositions[0];

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#040810] via-[#070e1c] to-[#040810]">
      <Canvas
        camera={{ position: currentCamPos, fov: 42, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* LIGHTING SETUP */}
        <ambientLight intensity={0.75} color="#ffffff" />
        <directionalLight position={[30, 40, 20]} intensity={1.3} color="#fffde7" castShadow />
        <pointLight position={[-20, 15, 20]} intensity={0.6} color="#00d4ff" />
        <pointLight position={[20, 15, -20]} intensity={0.5} color="#0066ff" />

        {/* 3D BUILDING MODEL */}
        <CECBuilding cameraView={cameraPreset} isPaused={isPaused} />

        {/* SMOOTH ORBIT CONTROLS */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={12}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2 - 0.05} // Don't go below ground
          target={[0, 2, 0]}
        />
      </Canvas>
    </div>
  );
}
