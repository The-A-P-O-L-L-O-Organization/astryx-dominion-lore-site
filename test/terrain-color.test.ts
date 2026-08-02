import { describe, it, expect } from 'vitest';
import { terrainColor } from '@/lib/starmap/terrain';

describe('terrainColor', () => {
  it('returns rocky color for rocky terrain', () => {
    expect(terrainColor('rocky')).toBe('#8B7355');
  });

  it('returns gas giant color', () => {
    expect(terrainColor('gas_giant')).toBe('#D4A574');
  });

  it('returns ice color', () => {
    expect(terrainColor('ice')).toBe('#B0D4F1');
  });

  it('returns ocean color', () => {
    expect(terrainColor('ocean')).toBe('#2E86AB');
  });

  it('returns lava color', () => {
    expect(terrainColor('lava')).toBe('#E85D04');
  });

  it('defaults to rocky for unknown terrain', () => {
    expect(terrainColor('desert')).toBe('#8B7355');
    expect(terrainColor('')).toBe('#8B7355');
    expect(terrainColor('forest')).toBe('#8B7355');
  });
});
