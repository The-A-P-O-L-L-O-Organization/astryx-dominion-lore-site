'use client'

import { useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'

interface StarSystem {
  id: string
  name: string
  x: number
  y: number
  z: number
  star: { color: string; size: number; star_type: string }
}

interface GalaxyViewProps {
  systems: StarSystem[]
  hyperlanes: [string, string][]
  onSelectSystem: (id: string) => void
}

function Systems({ systems, hyperlanes, onSelectSystem }: GalaxyViewProps) {
  const groupRef = useRef<THREE.Group>(null)

  const hyperlaneLines = useMemo(() => {
    const systemMap = new Map(systems.map(s => [s.id, s]))
    return hyperlanes.map(([from, to]) => {
      const a = systemMap.get(from)
      const b = systemMap.get(to)
      if (!a || !b) return null
      const points = [new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z)]
      return <Line key={`${from}-${to}`} points={points} color="#4fc3f7" transparent opacity={0.3} lineWidth={1} />
    }).filter(Boolean)
  }, [systems, hyperlanes])

  return (
    <group ref={groupRef}>
      {hyperlaneLines}
      {systems.map(system => (
        <group key={system.id} onClick={() => onSelectSystem(system.id)}>
          <mesh>
            <sphereGeometry args={[system.star.size * 0.3, 16, 16]} />
            <meshBasicMaterial color={system.star.color} />
          </mesh>
          <Text position={[0, system.star.size * 0.5 + 0.3, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="bottom">
            {system.name}
          </Text>
        </group>
      ))}
    </group>
  )
}

export function GalaxyView(props: GalaxyViewProps) {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} />
      <Systems {...props} />
      <OrbitControls enableDamping />
    </Canvas>
  )
}
