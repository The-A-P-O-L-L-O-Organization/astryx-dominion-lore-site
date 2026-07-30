import { db } from '@/lib/db'
import { users, campaigns, characters, contentCache, sessionNotes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const stats = {
    users: db.select().from(users).all().length,
    campaigns: db.select().from(campaigns).all().length,
    pendingCharacters: db.select().from(characters).where(eq(characters.isApproved, false)).all().length,
    pages: db.select().from(contentCache).all().length,
    notes: db.select().from(sessionNotes).all().length,
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Users', value: stats.users },
          { label: 'Campaigns', value: stats.campaigns },
          { label: 'Pending Characters', value: stats.pendingCharacters },
          { label: 'Lore Pages', value: stats.pages },
          { label: 'Session Notes', value: stats.notes },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
