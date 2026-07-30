import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'

export interface ParsedPage {
  pagePath: string
  markdownRaw: string
  htmlRendered: string
  frontmatter: Record<string, unknown>
  planetData: Record<string, unknown> | null
  sectionIds: string[]
}

const processor = remark()
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)

export function parseMarkdownFile(filePath: string, content: string): ParsedPage {
  const { data: frontmatter, content: mdContent } = matter(content)

  const pagePath = filePath
    .replace(/\.md$/, '')
    .replace(/^content\//, '')

  const htmlRendered = String(processor.processSync(mdContent))

  const sectionIds: string[] = []
  const headingRegex = /<h([1-6])[^>]*id="([^"]+)"[^>]*>/gi
  let match
  while ((match = headingRegex.exec(htmlRendered)) !== null) {
    sectionIds.push(match[2])
  }

  let planetData: Record<string, unknown> | null = null
  const type = frontmatter.type as string | undefined
  const systemId = frontmatter.system_id as string | undefined
  const celestialTypes = ['star', 'planet', 'moon', 'asteroid_belt', 'station']
  if (type && celestialTypes.includes(type) && systemId) {
    planetData = {
      type,
      system_id: systemId,
      name: frontmatter.title || pagePath.split('/').pop(),
      color: (frontmatter.planet_color as string) || '#4a9eff',
      ...(frontmatter.orbit_radius !== undefined && { orbit_radius: frontmatter.orbit_radius }),
      ...(frontmatter.orbit_speed !== undefined && { orbit_speed: frontmatter.orbit_speed }),
      ...(frontmatter.terrain_type !== undefined && { terrain_type: frontmatter.terrain_type }),
      ...(frontmatter.parent_id !== undefined && { parent_id: frontmatter.parent_id }),
      ...(frontmatter.star_type !== undefined && { star_type: frontmatter.star_type }),
      ...(frontmatter.belt_width !== undefined && { belt_width: frontmatter.belt_width }),
      ...(frontmatter.belt_density !== undefined && { belt_density: frontmatter.belt_density }),
      ...(frontmatter.station_type !== undefined && { station_type: frontmatter.station_type }),
    }
  }

  return { pagePath, markdownRaw: mdContent, htmlRendered, frontmatter, planetData, sectionIds }
}

export interface ParsedSessionNote {
  slug: string
  title: string
  contentMd: string
  isDmOnly: boolean
}

export function parseSessionNoteFile(content: string): ParsedSessionNote {
  const { data: frontmatter, content: mdContent } = matter(content)
  return {
    slug: (frontmatter.slug as string) || '',
    title: (frontmatter.title as string) || 'Untitled',
    contentMd: mdContent,
    isDmOnly: !!frontmatter.is_dm_only,
  }
}
