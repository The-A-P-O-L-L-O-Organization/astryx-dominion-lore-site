import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { characters, campaigns, sessionNotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function SessionsListPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = await params
  const characterIdNum = Number(characterId)
  if (isNaN(characterIdNum)) notFound()

  const session = await getSession()
  if (!session) redirect('/login')

  const character = db.select().from(characters).where(eq(characters.id, characterIdNum)).get()
  if (!character || character.userId !== session.user.id) notFound()
  if (!character.isApproved) notFound()

  const campaign = db.select().from(campaigns).where(eq(campaigns.id, character.campaignId)).get()
  if (!campaign) notFound()

  const notes = session.user.role === 'admin'
    ? db.select().from(sessionNotes).where(eq(sessionNotes.campaignId, campaign.id)).all()
    : db.select().from(sessionNotes).where(and(eq(sessionNotes.campaignId, campaign.id), eq(sessionNotes.isDmOnly, false))).all()

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/ch/${characterId}/lore`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Session Logs</h1>
          <p className="text-muted-foreground">{campaign.name}</p>
        </div>
      </div>

      {notes.length === 0 && (
        <p className="text-muted-foreground">No session notes yet.</p>
      )}

      <div className="grid gap-4">
        {notes.map(note => (
          <Link key={note.id} href={`/ch/${characterId}/sessions/${note.slug}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
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
                  {note.source === 'git' ? 'From lore repo' : 'Written in-app'} &middot; {new Date(note.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
