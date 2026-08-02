import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { characters, campaigns, users } from '@/lib/db/schema';

export interface CharacterAccess {
  user: typeof users.$inferSelect;
  character: typeof characters.$inferSelect;
  campaign: typeof campaigns.$inferSelect;
}

export async function requireCharacterAccess(
  characterId: string,
): Promise<CharacterAccess> {
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

  return { user: session.user, character, campaign };
}
