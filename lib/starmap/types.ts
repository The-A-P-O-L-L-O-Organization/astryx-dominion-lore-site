export interface SurfaceMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  type: string;
}

export interface CelestialBody {
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
  markers?: SurfaceMarker[];
  pagePath: string;
}

export interface StarSystem {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  star: { color: string; size: number; star_type: string };
}

export interface StarMapConfig {
  systems?: StarSystem[];
  hyperlanes?: [string, string][];
}
