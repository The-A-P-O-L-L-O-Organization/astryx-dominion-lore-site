'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { CelestialBody } from '@/lib/starmap/types';

interface SystemViewProps {
  starColor: string;
  starSize: number;
  bodies: CelestialBody[];
  onSelectPlanet: (pagePath: string) => void;
  onBack: () => void;
}

function OrbitingBody({
  body,
  index,
  onSelect,
}: {
  body: CelestialBody;
  index: number;
  onSelect: (path: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(0);
  const speed = body.orbit_speed || 0.2;
  const radius = body.orbit_radius || 2 + index * 1.5;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (angleRef.current === 0) angleRef.current = Math.random() * Math.PI * 2;
    angleRef.current += delta * speed;
    meshRef.current.position.x = Math.cos(angleRef.current) * radius;
    meshRef.current.position.z = Math.sin(angleRef.current) * radius;
  });

  const size =
    body.type === 'moon'
      ? 0.15
      : body.type === 'station'
        ? 0.12
        : body.type === 'asteroid_belt'
          ? 0.05
          : 0.3;

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                Array.from({ length: 65 }, (_, i) => {
                  const a = (i / 64) * Math.PI * 2;
                  return [Math.cos(a) * radius, 0, Math.sin(a) * radius];
                }).flat(),
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#444" transparent opacity={0.3} />
      </line>
      <mesh ref={meshRef} onClick={() => onSelect(body.pagePath)}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshStandardMaterial color={body.color} />
      </mesh>
      <Text
        position={[radius + 0.5, 0.3, 0]}
        fontSize={0.15}
        color="white"
        anchorX="left"
      >
        {body.name}
      </Text>
    </group>
  );
}

export function SystemView({
  starColor,
  starSize,
  bodies,
  onSelectPlanet,
  onBack,
}: SystemViewProps) {
  return (
    <div className="relative w-full h-full">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 px-3 py-1 bg-background/80 rounded text-sm"
      >
        Back to Galaxy
      </button>
      <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2} color={starColor} />
        <mesh>
          <sphereGeometry args={[starSize * 0.5, 32, 32]} />
          <meshBasicMaterial color={starColor} />
        </mesh>
        {bodies.map((body, i) => (
          <OrbitingBody
            key={body.pagePath}
            body={body}
            index={i}
            onSelect={onSelectPlanet}
          />
        ))}
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
