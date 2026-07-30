import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { characters, campaigns, contentCache } from '@/lib/db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { StarmapClient } from './starmap-client'

export default async function StarmapPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params
  const characterIdNum = Number(characterId)
  if (isNaN(characterIdNum)) notFound()

  const session = await getSession()
  if (!session) redirect('/login')

  const character = db.select().from(characters).where(eq(characters.id, characterIdNum)).get()
  if (!character || character.userId !== session.user.id) notFound()
  if (!character.isApproved) notFound()

  const campaign = db.select().from(campaigns).where(eq(campaigns.id, character.campaignId)).get()
  if (!campaign) notFound()

  const starMapConfig = JSON.parse(campaign.starMapConfig)

  const bodies = db.select({
    pagePath: contentCache.pagePath,
    planetData: contentCache.planetData,
    frontmatter: contentCache.frontmatter,
  }).from(contentCache)
    .where(and(eq(contentCache.campaignId, campaign.id), isNotNull(contentCache.planetData)))
    .all()
    .map(b => {
      const pd = JSON.parse(b.planetData!)
      const fm = JSON.parse(b.frontmatter)
      return {
        type: pd.type,
        name: pd.name || fm.title || b.pagePath,
        color: pd.color || '#4a9eff',
        orbit_radius: pd.orbit_radius,
        orbit_speed: pd.orbit_speed,
        terrain_type: pd.terrain_type,
        star_type: pd.star_type,
        belt_width: pd.belt_width,
        belt_density: pd.belt_density,
        parent_id: pd.parent_id,
        markers: pd.markers || [],
        pagePath: b.pagePath,
      }
    })

  return <StarmapClient config={starMapConfig} bodies={bodies} campaignName={campaign.name} />
}
