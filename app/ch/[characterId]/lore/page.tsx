import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { characters, campaigns, contentCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { LoreSidebar } from '@/components/lore-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function LoreIndexPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
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

  const pages = db
    .select({
      pagePath: contentCache.pagePath,
      frontmatter: contentCache.frontmatter,
    })
    .from(contentCache)
    .where(eq(contentCache.campaignId, campaign.id))
    .all()
    .map((p) => {
      const fm = JSON.parse(p.frontmatter);
      const parts = p.pagePath.split('/');
      return {
        path: p.pagePath,
        title: (fm.title as string) || parts[parts.length - 1],
        category: parts.length > 1 ? parts[0] : undefined,
      };
    });

  return (
    <div className="flex h-screen">
      <LoreSidebar
        items={pages}
        characterId={characterId}
        campaignName={campaign.name}
      />
      <main className="flex-1 p-8 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to {campaign.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Select a topic from the sidebar to begin exploring the lore of{' '}
              {campaign.name}.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
