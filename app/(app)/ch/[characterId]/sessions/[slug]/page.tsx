import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { characters, campaigns, sessionNotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

const processor = remark()
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

export default async function SessionNotePage({
  params,
}: {
  params: Promise<{ characterId: string; slug: string }>;
}) {
  const { characterId, slug } = await params;
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
  if (note.isDmOnly && session.user.role !== 'admin') notFound();

  const html = String(processor.processSync(note.contentMd));

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
