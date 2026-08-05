import { db } from '@/lib/db';
import { contentCache } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { requireCharacterAccess } from '@/lib/character-access';
import type { CelestialBody, StarMapConfig } from '@/lib/starmap/types';
import { StarmapClient } from './starmap-client';

export default async function StarmapPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const { campaign } = await requireCharacterAccess(characterId);

  const starMapConfig = JSON.parse(campaign.starMapConfig) as StarMapConfig;

  const bodies: CelestialBody[] = db
    .select({
      pagePath: contentCache.pagePath,
      planetData: contentCache.planetData,
      frontmatter: contentCache.frontmatter,
    })
    .from(contentCache)
    .where(
      and(
        eq(contentCache.campaignId, campaign.id),
        isNotNull(contentCache.planetData),
      ),
    )
    .all()
    .map((b) => {
      const pd = JSON.parse(b.planetData!);
      const fm = JSON.parse(b.frontmatter);
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
      };
    });

  return (
    <StarmapClient
      config={starMapConfig}
      bodies={bodies}
      campaignName={campaign.name}
    />
  );
}
