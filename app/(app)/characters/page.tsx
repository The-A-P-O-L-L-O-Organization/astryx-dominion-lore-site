import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { characters, campaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { CharacterList } from './character-list';

export default async function CharactersPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const { user } = session;

  const myCharacters = db
    .select()
    .from(characters)
    .where(eq(characters.userId, user.id))
    .all();

  const campaignsWithThemes = db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      description: campaigns.description,
      theme: campaigns.theme,
      isHidden: campaigns.isHidden,
    })
    .from(campaigns)
    .all();

  return (
    <CharacterList
      characters={myCharacters}
      campaigns={campaignsWithThemes}
      userId={user.id}
    />
  );
}
