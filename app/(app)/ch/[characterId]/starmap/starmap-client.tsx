'use client';

import { useState } from 'react';
import { GalaxyView } from '@/components/starmap/galaxy-view';
import { SystemView } from '@/components/starmap/system-view';
import { PlanetSurfaceView } from '@/components/starmap/planet-surface-view';
import type { CelestialBody, StarMapConfig } from '@/lib/starmap/types';

type View = 'galaxy' | 'system' | 'planet';

export function StarmapClient({
  config,
  bodies,
  campaignName,
}: {
  config: StarMapConfig;
  bodies: CelestialBody[];
  campaignName: string;
}) {
  const [view, setView] = useState<View>('galaxy');
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<CelestialBody | null>(
    null,
  );

  const systems = config.systems || [];

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
      <div className="h-[calc(100vh-12rem)] w-full overflow-hidden rounded-lg border bg-background">
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
      <div className="h-[calc(100vh-12rem)] w-full overflow-hidden rounded-lg border bg-background">
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
      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-background">
        <div className="relative flex-1">
          <PlanetSurfaceView
            planetName={selectedPlanet.name}
            color={selectedPlanet.color}
            terrainType={selectedPlanet.terrain_type || 'rocky'}
            markers={selectedPlanet.markers || []}
            onBack={() => setView('system')}
          />
        </div>
        <aside className="w-80 overflow-y-auto border-l border-border p-4">
          <h2 className="text-lg font-semibold tracking-tight mb-2">
            {selectedPlanet.name}
          </h2>
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
