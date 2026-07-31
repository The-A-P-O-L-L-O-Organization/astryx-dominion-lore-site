import { db } from '@/lib/db';
import {
  users,
  campaigns,
  characters,
  contentCache,
  sessionNotes,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent } from '@/components/ui/card';

export default async function AdminDashboard() {
  const stats = {
    users: db.select().from(users).all().length,
    campaigns: db.select().from(campaigns).all().length,
    pendingCharacters: db
      .select()
      .from(characters)
      .where(eq(characters.isApproved, false))
      .all().length,
    pages: db.select().from(contentCache).all().length,
    notes: db.select().from(sessionNotes).all().length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of the Astryx Dominion community.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Users', value: stats.users },
          { label: 'Campaigns', value: stats.campaigns },
          { label: 'Pending Characters', value: stats.pendingCharacters },
          { label: 'Lore Pages', value: stats.pages },
          { label: 'Session Notes', value: stats.notes },
        ].map((s) => (
          <Card
            key={s.label}
            className="transition-colors hover:border-accent/50"
          >
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
