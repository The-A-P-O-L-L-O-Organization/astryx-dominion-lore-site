import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { contentCache } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireCharacterAccess } from '@/lib/character-access';
import { getLoreIndex } from '@/lib/content/lore-index';
import { LoreSidebar } from '@/components/lore-sidebar';
import { LoreContent } from '@/components/lore-content';
import {
  getPageVisibility,
  getHiddenSectionIds,
} from '@/lib/content/visibility';
import { parseJsonOrDefault } from '@/lib/json';

export default async function LorePage({
  params,
}: {
  params: Promise<{ characterId: string; pagePath: string[] }>;
}) {
  const { characterId, pagePath } = await params;
  const { campaign } = await requireCharacterAccess(characterId);

  const pagePathStr = pagePath.join('/');

  const cached = db
    .select()
    .from(contentCache)
    .where(
      and(
        eq(contentCache.campaignId, campaign.id),
        eq(contentCache.pagePath, pagePathStr),
      ),
    )
    .get();
  if (!cached) notFound();

  const isPageVisible = getPageVisibility(campaign.id, pagePathStr);
  const hiddenSectionIds = getHiddenSectionIds(campaign.id, pagePathStr);

  const pages = getLoreIndex(campaign.id);

  const fm = parseJsonOrDefault<{ title?: string }>(
    cached.frontmatter,
    `frontmatter for ${pagePathStr}`,
    {},
  );

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <LoreSidebar
        items={pages}
        characterId={characterId}
        campaignName={campaign.name}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight mb-6">
            {(fm.title as string) || pagePathStr}
          </h1>
          {isPageVisible ? (
            <LoreContent
              html={cached.htmlRendered}
              hiddenSectionIds={hiddenSectionIds}
            />
          ) : (
            <div className="rounded-lg border border-dashed py-16 text-center">
              <p className="text-xl text-muted-foreground italic">
                Your knowledge of this topic is incomplete...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
