import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { characters, campaigns, sessionNotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function SessionsListPage({
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

  const notes =
    session.user.role === 'admin'
      ? db
          .select()
          .from(sessionNotes)
          .where(eq(sessionNotes.campaignId, campaign.id))
          .all()
      : db
          .select()
          .from(sessionNotes)
          .where(
            and(
              eq(sessionNotes.campaignId, campaign.id),
              eq(sessionNotes.isDmOnly, false),
            ),
          )
          .all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Session Logs</h1>
        <p className="text-sm text-muted-foreground">
          Records from {campaign.name}
        </p>
      </div>

      {notes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No session notes yet.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {notes.map((note) => (
          <Link key={note.id} href={`/ch/${characterId}/sessions/${note.slug}`}>
            <Card className="transition-colors hover:border-accent/50 hover:bg-accent/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  {note.isDmOnly ? (
                    <Badge variant="secondary">DM&apos;s Notes</Badge>
                  ) : (
                    <Badge>Session Log</Badge>
                  )}
                </div>
                <CardDescription>
                  {note.source === 'git' ? 'From lore repo' : 'Written in-app'}{' '}
                  &middot; {new Date(note.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
