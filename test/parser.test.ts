import { describe, it, expect } from 'vitest'
import { parseMarkdownFile, parseSessionNoteFile } from '@/lib/content/parser'

describe('parseMarkdownFile', () => {
  it('parses basic markdown content', () => {
    const result = parseMarkdownFile('content/index.md', '# Hello\n\nThis is a test.')
    expect(result.pagePath).toBe('index')
    expect(result.markdownRaw).toBe('# Hello\n\nThis is a test.')
    expect(result.htmlRendered).toContain('<h1 id="hello">Hello</h1>')
    expect(result.frontmatter).toEqual({})
    expect(result.sectionIds).toEqual(['hello'])
    expect(result.planetData).toBeNull()
  })

  it('extracts frontmatter', () => {
    const md = '---\ntitle: Tyron Prime\ntags:\n  - core\n---\n# Planet'
    const result = parseMarkdownFile('content/planets/tyron-prime.md', md)
    expect(result.frontmatter).toEqual({ title: 'Tyron Prime', tags: ['core'] })
    expect(result.pagePath).toBe('planets/tyron-prime')
  })

  it('strips content/ prefix from pagePath', () => {
    const result = parseMarkdownFile('content/factions/house-vex.md', '# House Vex')
    expect(result.pagePath).toBe('factions/house-vex')
  })

  it('removes .md extension from pagePath', () => {
    const result = parseMarkdownFile('content/index.md', '# Index')
    expect(result.pagePath).toBe('index')
  })

  it('preserves nested paths without content/ prefix', () => {
    const result = parseMarkdownFile('content/a/b/c/page.md', '# Deep')
    expect(result.pagePath).toBe('a/b/c/page')
  })

  it('extracts section IDs from headings', () => {
    const md = '# Top\n\n## Section One\n\nContent\n\n### Subsection\n\nMore'
    const result = parseMarkdownFile('content/page.md', md)
    expect(result.sectionIds).toContain('section-one')
    expect(result.sectionIds).toContain('subsection')
  })

  it('extracts planetData for planet type with system_id', () => {
    const md = `---
title: Tyron Prime
type: planet
system_id: core-systems
planet_color: "#4a9eff"
orbit_radius: 3.5
orbit_speed: 0.15
terrain_type: rocky
---
# Tyron Prime
`
    const result = parseMarkdownFile('content/planets/tyron-prime.md', md)
    expect(result.planetData).not.toBeNull()
    expect(result.planetData!.type).toBe('planet')
    expect(result.planetData!.system_id).toBe('core-systems')
    expect(result.planetData!.color).toBe('#4a9eff')
    expect(result.planetData!.orbit_radius).toBe(3.5)
    expect(result.planetData!.orbit_speed).toBe(0.15)
    expect(result.planetData!.terrain_type).toBe('rocky')
  })

  it('extracts planetData for star type', () => {
    const md = `---
title: Sol
type: star
system_id: core-systems
star_type: yellow_dwarf
planet_color: "#ffd700"
---
# Sol
`
    const result = parseMarkdownFile('content/stars/sol.md', md)
    expect(result.planetData).not.toBeNull()
    expect(result.planetData!.type).toBe('star')
    expect(result.planetData!.star_type).toBe('yellow_dwarf')
  })

  it('extracts planetData for moon type', () => {
    const md = `---
title: Luna
type: moon
system_id: core-systems
parent_id: tyron-prime
orbit_radius: 0.5
---
# Luna
`
    const result = parseMarkdownFile('content/moons/luna.md', md)
    expect(result.planetData).not.toBeNull()
    expect(result.planetData!.type).toBe('moon')
    expect(result.planetData!.parent_id).toBe('tyron-prime')
  })

  it('extracts planetData for asteroid_belt type', () => {
    const md = `---
title: The Ring
type: asteroid_belt
system_id: outer-rim
belt_width: 2.0
belt_density: 0.8
---
# The Ring
`
    const result = parseMarkdownFile('content/belts/ring.md', md)
    expect(result.planetData).not.toBeNull()
    expect(result.planetData!.type).toBe('asteroid_belt')
    expect(result.planetData!.belt_width).toBe(2.0)
    expect(result.planetData!.belt_density).toBe(0.8)
  })

  it('extracts planetData for station type', () => {
    const md = `---
title: Deep Space 9
type: station
system_id: core-systems
station_type: orbital
---
# DS9
`
    const result = parseMarkdownFile('content/stations/ds9.md', md)
    expect(result.planetData).not.toBeNull()
    expect(result.planetData!.type).toBe('station')
    expect(result.planetData!.station_type).toBe('orbital')
  })

  it('returns null planetData when type is not celestial', () => {
    const md = `---
title: Factions
type: page
---
# Factions
`
    const result = parseMarkdownFile('content/factions/index.md', md)
    expect(result.planetData).toBeNull()
  })

  it('returns null planetData when system_id is missing', () => {
    const md = `---
title: Mystery Planet
type: planet
---
# Mystery
`
    const result = parseMarkdownFile('content/planets/mystery.md', md)
    expect(result.planetData).toBeNull()
  })

  it('renders GFM tables', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |'
    const result = parseMarkdownFile('content/page.md', md)
    expect(result.htmlRendered).toContain('<table>')
    expect(result.htmlRendered).toContain('<th>A</th>')
  })

  it('renders GFM task lists', () => {
    const md = '- [x] done\n- [ ] todo'
    const result = parseMarkdownFile('content/page.md', md)
    expect(result.htmlRendered).toContain('checked')
  })

  it('renders inline HTML when present', () => {
    const md = '<div class="custom">Hello</div>'
    const result = parseMarkdownFile('content/page.md', md)
    expect(result.htmlRendered).toContain('<div class="custom">')
  })

  it('handles empty content', () => {
    const result = parseMarkdownFile('content/empty.md', '')
    expect(result.pagePath).toBe('empty')
    expect(result.htmlRendered).toBe('')
    expect(result.frontmatter).toEqual({})
    expect(result.planetData).toBeNull()
  })

  it('handles content with only frontmatter', () => {
    const md = '---\ntitle: Only Frontmatter\n---'
    const result = parseMarkdownFile('content/only-fm.md', md)
    expect(result.frontmatter.title).toBe('Only Frontmatter')
    expect(result.markdownRaw).toBe('')
  })

  it('generates heading IDs for section ids', () => {
    const md = '## Hello World\n\n### Foo Bar Baz'
    const result = parseMarkdownFile('content/page.md', md)
    expect(result.sectionIds).toEqual(['hello-world', 'foo-bar-baz'])
  })
})

describe('parseSessionNoteFile', () => {
  it('parses a basic session note', () => {
    const md = '---\ntitle: Session 1\nslug: session-001\n---\nWe began our journey...'
    const result = parseSessionNoteFile(md)
    expect(result.title).toBe('Session 1')
    expect(result.slug).toBe('session-001')
    expect(result.contentMd).toBe('We began our journey...')
    expect(result.isDmOnly).toBe(false)
  })

  it('marks DM-only notes when is_dm_only is true', () => {
    const md = '---\ntitle: DM Prep\nslug: session-002-dm\nis_dm_only: true\n---\nSecret notes'
    const result = parseSessionNoteFile(md)
    expect(result.isDmOnly).toBe(true)
  })

  it('defaults title to Untitled when missing', () => {
    const md = '---\nslug: no-title\n---\nContent'
    const result = parseSessionNoteFile(md)
    expect(result.title).toBe('Untitled')
  })

  it('defaults slug to empty string when missing', () => {
    const md = '---\ntitle: No Slug\n---\nContent'
    const result = parseSessionNoteFile(md)
    expect(result.slug).toBe('')
  })

  it('defaults isDmOnly to false', () => {
    const md = '---\ntitle: Test\nslug: test\n---\nContent'
    const result = parseSessionNoteFile(md)
    expect(result.isDmOnly).toBe(false)
  })

  it('handles content with no frontmatter', () => {
    const result = parseSessionNoteFile('Just some notes')
    expect(result.title).toBe('Untitled')
    expect(result.slug).toBe('')
    expect(result.contentMd).toBe('Just some notes')
    expect(result.isDmOnly).toBe(false)
  })
})
