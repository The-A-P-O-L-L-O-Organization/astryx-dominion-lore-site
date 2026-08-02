import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionNotes, characters } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth';
import {
  badRequest,
  notFound,
  parseNumericId,
  withGuard,
} from '@/lib/api/responses';
import {
  listSessionNotes,
  sanitizeSlug,
  writeSessionNoteFile,
} from '@/lib/content/session-notes';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const characterId = searchParams.get('characterId');

  return withGuard(requireAuth, ({ user }) => {
    if (characterId) {
      const characterIdNum = parseNumericId(characterId);
      if (characterIdNum === null) return badRequest('Invalid character ID');

      const character = db
        .select()
        .from(characters)
        .where(eq(characters.id, characterIdNum))
        .get();
      if (!character || character.userId !== user.id) return notFound();

      return NextResponse.json(
        listSessionNotes(character.campaignId, user.role === 'admin'),
      );
    }

    if (campaignId && user.role === 'admin') {
      const campaignIdNum = parseNumericId(campaignId);
      if (campaignIdNum === null) return badRequest('Invalid campaign ID');
      return NextResponse.json(listSessionNotes(campaignIdNum, true));
    }

    return badRequest();
  });
}

export async function POST(request: Request) {
  return withGuard(requireAdmin, async () => {
    const body = await request.json();

    const campaignIdNum = parseNumericId(body.campaignId);
    if (campaignIdNum === null) return badRequest('Invalid campaign ID');

    const slug = sanitizeSlug(body.slug);
    db.insert(sessionNotes)
      .values({
        campaignId: campaignIdNum,
        slug,
        title: body.title,
        contentMd: body.contentMd,
        authorId: body.authorId || null,
        isDmOnly: body.isDmOnly || false,
      })
      .run();

    const written = await writeSessionNoteFile({
      campaignId: campaignIdNum,
      slug,
      title: body.title,
      contentMd: body.contentMd,
      isDmOnly: !!body.isDmOnly,
    });
    if (!written) return badRequest('Invalid slug');

    return NextResponse.json(
      { message: 'Session note created' },
      { status: 201 },
    );
  });
}

export async function PUT(request: Request) {
  return withGuard(requireAdmin, async () => {
    const body = await request.json();
    db.update(sessionNotes)
      .set({
        title: body.title,
        contentMd: body.contentMd,
        isDmOnly: body.isDmOnly,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessionNotes.id, body.id))
      .run();

    const note = db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.id, body.id))
      .get();
    if (note) {
      const written = await writeSessionNoteFile({
        campaignId: note.campaignId,
        slug: note.slug,
        title: body.title,
        contentMd: body.contentMd,
        isDmOnly: !!body.isDmOnly,
      });
      if (!written) return badRequest('Invalid slug');
    }

    return NextResponse.json({ message: 'Session note updated' });
  });
}

export async function DELETE(request: Request) {
  return withGuard(requireAdmin, async () => {
    const { id } = await request.json();
    db.delete(sessionNotes).where(eq(sessionNotes.id, id)).run();
    return NextResponse.json({ message: 'Session note deleted' });
  });
}
