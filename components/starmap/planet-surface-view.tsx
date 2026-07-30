'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere } from '@react-three/drei'
import * as THREE from 'three'

interface Marker {
  id: string; name: string; lat: number; lon: number; description: string; type: string
}

interface PlanetSurfaceViewProps {
  planetName: string
  color: string
  terrainType: string
  markers: Marker[]
  onBack: () => void
}

function terrainColor(terrainType: string): string {
  switch (terrainType) {
    case 'rocky': return '#8B7355'
    case 'gas_giant': return '#D4A574'
    case 'ice': return '#B0D4F1'
    case 'ocean': return '#2E86AB'
    case 'lava': return '#E85D04'
    default: return '#8B7355'
  }
}

function MarkerPins({ markers }: { markers: Marker[] }) {
  return (
    <group>
      {markers.map(marker => {
        const phi = (90 - marker.lat) * (Math.PI / 180)
        const theta = marker.lon * (Math.PI / 180)
        const r = 1.01
        const x = r * Math.sin(phi) * Math.cos(theta)
        const y = r * Math.cos(phi)
        const z = r * Math.sin(phi) * Math.sin(theta)
        return (
          <group key={marker.id} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color="#ff4444" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export function PlanetSurfaceView({ planetName, color, terrainType, markers, onBack }: PlanetSurfaceViewProps) {
  return (
    <div className="relative w-full h-full">
      <button onClick={onBack} className="absolute top-4 left-4 z-10 px-3 py-1 bg-background/80 rounded text-sm">
        Back to System
      </button>
      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-background/80 rounded text-sm">
        {planetName}
      </div>
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <Sphere args={[1, 64, 64]}>
          <meshStandardMaterial color={terrainColor(terrainType)} />
        </Sphere>
        <MarkerPins markers={markers} />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  )
}
