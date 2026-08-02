const TERRAIN_COLORS: Record<string, string> = {
  rocky: '#8B7355',
  gas_giant: '#D4A574',
  ice: '#B0D4F1',
  ocean: '#2E86AB',
  lava: '#E85D04',
};

export const DEFAULT_TERRAIN_COLOR = TERRAIN_COLORS.rocky;

export function terrainColor(terrainType: string): string {
  return TERRAIN_COLORS[terrainType] || DEFAULT_TERRAIN_COLOR;
}
