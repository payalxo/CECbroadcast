import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Glides the camera to the chosen view. On narrow screens it pulls back so the whole building fits.
export default function CameraRig({ preset, positions }) {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const factor = Math.round(Math.min(2.6, Math.max(1, 1.39 / aspect)) * 10) / 10;
  const goal = useRef(new THREE.Vector3(...positions[0]).multiplyScalar(factor));
  const moving = useRef(false);

  useEffect(() => {
    const p = positions[preset] || positions[0];
    goal.current.set(p[0], p[1], p[2]).multiplyScalar(factor);
    moving.current = true;
  }, [preset, factor]);

  useFrame(() => {
    if (!moving.current) return;
    camera.position.lerp(goal.current, 0.08);
    if (camera.position.distanceTo(goal.current) < 0.05) moving.current = false;
  });

  return null;
}