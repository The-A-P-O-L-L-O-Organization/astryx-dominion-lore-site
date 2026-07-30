import { describe, it, expect } from 'vitest'

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

describe('terrainColor', () => {
  it('returns rocky color for rocky terrain', () => {
    expect(terrainColor('rocky')).toBe('#8B7355')
  })

  it('returns gas giant color', () => {
    expect(terrainColor('gas_giant')).toBe('#D4A574')
  })

  it('returns ice color', () => {
    expect(terrainColor('ice')).toBe('#B0D4F1')
  })

  it('returns ocean color', () => {
    expect(terrainColor('ocean')).toBe('#2E86AB')
  })

  it('returns lava color', () => {
    expect(terrainColor('lava')).toBe('#E85D04')
  })

  it('defaults to rocky for unknown terrain', () => {
    expect(terrainColor('desert')).toBe('#8B7355')
    expect(terrainColor('')).toBe('#8B7355')
    expect(terrainColor('forest')).toBe('#8B7355')
  })
})
