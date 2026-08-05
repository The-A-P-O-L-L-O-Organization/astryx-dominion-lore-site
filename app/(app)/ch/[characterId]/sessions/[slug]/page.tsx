import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { sessionNotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { requireCharacterAccess } from '@/lib/character-access';
import { renderMarkdown } from '@/lib/content/markdown';

export default async function SessionNotePage({
  params,
}: {
  params: Promise<{ characterId: string; slug: string }>;
}) {
  const { characterId, slug } = await params;
  const { user, character } = await requireCharacterAccess(characterId);

  const note = db
    .select()
    .from(sessionNotes)
    .where(
      and(
        eq(sessionNotes.campaignId, character.campaignId),
        eq(sessionNotes.slug, slug),
      ),
    )
    .get();

  if (!note) notFound();
  if (note.isDmOnly && user.role !== 'admin') notFound();

  const html = renderMarkdown(note.contentMd);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {note.title}
          </h1>
          {note.isDmOnly ? (
            <Badge variant="secondary">DM&apos;s Notes</Badge>
          ) : (
            <Badge>Session Log</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(note.createdAt).toLocaleDateString()} &middot;{' '}
          {note.source === 'git' ? 'From lore repo' : 'Written in-app'}
        </p>
      </div>
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
