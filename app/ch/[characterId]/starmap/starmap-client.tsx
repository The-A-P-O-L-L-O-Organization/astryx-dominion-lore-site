'use client';

import { useState } from 'react';
import { GalaxyView } from '@/components/starmap/galaxy-view';
import { SystemView } from '@/components/starmap/system-view';
import { PlanetSurfaceView } from '@/components/starmap/planet-surface-view';

type View = 'galaxy' | 'system' | 'planet';
type CelestialBody = {
  type: string;
  name: string;
  color: string;
  orbit_radius?: number;
  orbit_speed?: number;
  terrain_type?: string;
  star_type?: string;
  belt_width?: number;
  belt_density?: number;
  parent_id?: string;
  markers?: any[];
  pagePath: string;
};

export function StarmapClient({
  config,
  bodies,
  campaignName,
}: {
  config: any;
  bodies: CelestialBody[];
  campaignName: string;
}) {
  const [view, setView] = useState<View>('galaxy');
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<CelestialBody | null>(
    null,
  );

  const systems = (config.systems || []) as Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    star: { color: string; size: number; star_type: string };
  }>;

  function handleSelectSystem(id: string) {
    setSelectedSystemId(id);
    setView('system');
  }

  function handleSelectPlanet(pagePath: string) {
    const body = bodies.find((b) => b.pagePath === pagePath);
    if (body && (body.type === 'planet' || body.type === 'moon')) {
      setSelectedPlanet(body);
      setView('planet');
    }
  }

  if (view === 'galaxy') {
    return (
      <div className="w-full h-screen">
        <GalaxyView
          systems={systems}
          hyperlanes={config.hyperlanes || []}
          onSelectSystem={handleSelectSystem}
        />
      </div>
    );
  }

  if (view === 'system') {
    const system = systems.find((s) => s.id === selectedSystemId);
    if (!system) return <div>System not found</div>;
    return (
      <div className="w-full h-screen">
        <SystemView
          starColor={system.star.color}
          starSize={system.star.size}
          bodies={bodies}
          onSelectPlanet={handleSelectPlanet}
          onBack={() => setView('galaxy')}
        />
      </div>
    );
  }

  if (view === 'planet' && selectedPlanet) {
    return (
      <div className="w-full h-screen flex">
        <div className="flex-1 relative">
          <PlanetSurfaceView
            planetName={selectedPlanet.name}
            color={selectedPlanet.color}
            terrainType={selectedPlanet.terrain_type || 'rocky'}
            markers={selectedPlanet.markers || []}
            onBack={() => setView('system')}
          />
        </div>
        <aside className="w-96 border-l border-border p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{selectedPlanet.name}</h2>
          <p className="text-sm text-muted-foreground">
            Planet surface view. Markers appear as red pins. Click and drag to
            rotate. Scroll to zoom.
          </p>
        </aside>
      </div>
    );
  }

  return <div>Loading...</div>;
}
