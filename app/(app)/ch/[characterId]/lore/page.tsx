import { requireCharacterAccess } from '@/lib/character-access';
import { getLoreIndex } from '@/lib/content/lore-index';
import { LoreSidebar } from '@/components/lore-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function LoreIndexPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const { campaign } = await requireCharacterAccess(characterId);

  const pages = getLoreIndex(campaign.id);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <LoreSidebar
        items={pages}
        characterId={characterId}
        campaignName={campaign.name}
      />
      <main className="min-w-0 flex-1">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Welcome to {campaign.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Select a topic from the lore index to begin exploring the story of{' '}
              {campaign.name}.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
