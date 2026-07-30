import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sessionNotes, characters } from '@/lib/db/schema'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const CONTENT_DIR = process.env.CONTENT_DIR || '/data/repos'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')
  const characterId = searchParams.get('characterId')

  try {
    const { user } = await requireAuth()

    let notes
    if (characterId) {
      const characterIdNum = Number(characterId)
      if (isNaN(characterIdNum)) return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
      const character = db.select().from(characters).where(eq(characters.id, characterIdNum)).get()
      if (!character || character.userId !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      if (user.role === 'admin') {
        notes = db.select().from(sessionNotes)
          .where(eq(sessionNotes.campaignId, character.campaignId))
          .all()
      } else {
        notes = db.select().from(sessionNotes)
          .where(and(
            eq(sessionNotes.campaignId, character.campaignId),
            eq(sessionNotes.isDmOnly, false)
          )).all()
      }
    } else if (campaignId && user.role === 'admin') {
      const campaignIdNum = Number(campaignId)
      if (isNaN(campaignIdNum)) return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 })
      notes = db.select().from(sessionNotes)
        .where(eq(sessionNotes.campaignId, campaignIdNum))
        .all()
    } else {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    return NextResponse.json(notes)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()

    db.insert(sessionNotes).values({
      campaignId: body.campaignId,
      slug: body.slug,
      title: body.title,
      contentMd: body.contentMd,
      authorId: body.authorId || null,
      isDmOnly: body.isDmOnly || false,
    }).run()

    const repoDir = path.join(CONTENT_DIR, String(body.campaignId), 'session-notes')
    if (!existsSync(repoDir)) await mkdir(repoDir, { recursive: true })
    await writeFile(path.join(repoDir, `${body.slug}.md`), `---\ntitle: ${body.title}\nis_dm_only: ${!!body.isDmOnly}\nslug: ${body.slug}\n---\n\n${body.contentMd}`)

    return NextResponse.json({ message: 'Session note created' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    db.update(sessionNotes).set({
      title: body.title,
      contentMd: body.contentMd,
      isDmOnly: body.isDmOnly,
      updatedAt: new Date().toISOString(),
    }).where(eq(sessionNotes.id, body.id)).run()

    const note = db.select().from(sessionNotes).where(eq(sessionNotes.id, body.id)).get()
    if (note) {
      const repoDir = path.join(CONTENT_DIR, String(note.campaignId), 'session-notes')
      if (!existsSync(repoDir)) await mkdir(repoDir, { recursive: true })
      await writeFile(path.join(repoDir, `${note.slug}.md`), `---\ntitle: ${body.title}\nis_dm_only: ${!!body.isDmOnly}\nslug: ${note.slug}\n---\n\n${body.contentMd}`)
    }

    return NextResponse.json({ message: 'Session note updated' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    const { id } = await request.json()
    db.delete(sessionNotes).where(eq(sessionNotes.id, id)).run()
    return NextResponse.json({ message: 'Session note deleted' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
