import { redirect } from 'next/navigation';

import { AppShell } from '@/components/app-shell';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db/index';
import { characters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const userCharacters = db
    .select({ id: characters.id, name: characters.name })
    .from(characters)
    .where(eq(characters.userId, session.user.id))
    .all();

  return (
    <AppShell
      characters={userCharacters}
      isAdmin={session.user.role === 'admin'}
      username={session.user.username}
    >
      {children}
    </AppShell>
  );
}
