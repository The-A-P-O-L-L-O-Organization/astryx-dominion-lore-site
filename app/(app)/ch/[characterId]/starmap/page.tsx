import { db } from '@/lib/db';
import { contentCache } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { requireCharacterAccess } from '@/lib/character-access';
import type { CelestialBody, StarMapConfig } from '@/lib/starmap/types';
import { StarmapClient } from './starmap-client';
import { parseJsonOrDefault } from '@/lib/json';

interface PlanetData {
  type?: string;
  name?: string;
  color?: string;
  orbit_radius?: number;
  orbit_speed?: number;
  terrain_type?: string;
  star_type?: string;
  belt_width?: number;
  belt_density?: number;
  parent_id?: string;
  markers?: unknown[];
}

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
    .flatMap((b) => {
      const pd = parseJsonOrDefault<PlanetData>(
        b.planetData,
        `planet_data for ${b.pagePath}`,
        {},
      );
      const fm = parseJsonOrDefault<{ title?: string }>(
        b.frontmatter,
        `frontmatter for ${b.pagePath}`,
        {},
      );
      if (!pd.type) {
        console.error(
          `Skipping star map body ${b.pagePath}: planet_data has no type`,
        );
        return [];
      }
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
