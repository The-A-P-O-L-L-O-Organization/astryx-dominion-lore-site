import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { characters, campaigns, contentCache } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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
  const characterIdNum = Number(characterId);
  if (isNaN(characterIdNum)) notFound();
  const session = await getSession();
  if (!session) redirect('/login');

  const character = db
    .select()
    .from(characters)
    .where(eq(characters.id, characterIdNum))
    .get();
  if (!character || character.userId !== session.user.id) notFound();
  if (!character.isApproved) notFound();

  const campaign = db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, character.campaignId))
    .get();
  if (!campaign) notFound();

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

  const pages = db
    .select({
      pagePath: contentCache.pagePath,
      frontmatter: contentCache.frontmatter,
    })
    .from(contentCache)
    .where(eq(contentCache.campaignId, campaign.id))
    .all()
    .map((p) => {
      const fm = parseJsonOrDefault<{ title?: string }>(
        p.frontmatter,
        `frontmatter for ${p.pagePath}`,
        {},
      );
      const parts = p.pagePath.split('/');
      return {
        path: p.pagePath,
        title: (fm.title as string) || parts[parts.length - 1],
        category: parts.length > 1 ? parts[0] : undefined,
      };
    });

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
