import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Glides the camera to the chosen view, then lets you orbit freely.
export default function CameraRig({ preset, positions }) {
  const { camera } = useThree();
  const goal = useRef(new THREE.Vector3(...positions[0]));
  const moving = useRef(false);

  useEffect(() => {
    goal.current.set(...(positions[preset] || positions[0]));
    moving.current = true;
  }, [preset]);

  useFrame(() => {
    if (!moving.current) return;
    camera.position.lerp(goal.current, 0.08);
    if (camera.position.distanceTo(goal.current) < 0.05) moving.current = false;
  });

  return null;
}