import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionNotes, characters } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import {
  BadRequestError,
  errorResponse,
  optionalString,
  parseJsonBody,
  requireNumber,
  requireString,
} from '@/lib/api-errors';
import {
  listSessionNotes,
  sanitizeSlug,
  writeSessionNoteFile,
} from '@/lib/content/session-notes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const characterId = searchParams.get('characterId');

  try {
    const { user } = await requireAuth();

    if (characterId) {
      const characterIdNum = Number(characterId);
      if (isNaN(characterIdNum)) throw new BadRequestError('Invalid character ID');
      const character = db
        .select()
        .from(characters)
        .where(eq(characters.id, characterIdNum))
        .get();
      if (!character || character.userId !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(
        listSessionNotes(character.campaignId, user.role === 'admin'),
      );
    }

    if (campaignId && user.role === 'admin') {
      const campaignIdNum = Number(campaignId);
      if (isNaN(campaignIdNum)) throw new BadRequestError('Invalid campaign ID');
      return NextResponse.json(listSessionNotes(campaignIdNum, true));
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  } catch (err) {
    return errorResponse('GET /api/sessions', err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);

    const campaignIdNum = requireNumber(body, 'campaignId');
    const title = requireString(body, 'title');
    const contentMd = optionalString(body, 'contentMd');
    const isDmOnly = !!body.isDmOnly;

    const slug = sanitizeSlug(requireString(body, 'slug'));
    if (!slug) throw new BadRequestError('Invalid slug');

    db.insert(sessionNotes)
      .values({
        campaignId: campaignIdNum,
        slug,
        title,
        contentMd,
        authorId: typeof body.authorId === 'number' ? body.authorId : null,
        isDmOnly,
      })
      .run();

    const written = await writeSessionNoteFile({
      campaignId: campaignIdNum,
      slug,
      title,
      contentMd,
      isDmOnly,
    });
    if (!written) throw new BadRequestError('Invalid slug');

    return NextResponse.json(
      { message: 'Session note created' },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse('POST /api/sessions', err);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const id = requireNumber(body, 'id');
    const title =
      body.title === undefined ? undefined : requireString(body, 'title');
    const contentMd =
      body.contentMd === undefined ? undefined : optionalString(body, 'contentMd');
    const isDmOnly =
      body.isDmOnly === undefined ? undefined : !!body.isDmOnly;

    db.update(sessionNotes)
      .set({
        title,
        contentMd,
        isDmOnly,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sessionNotes.id, id))
      .run();

    const note = db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.id, id))
      .get();
    if (note) {
      const written = await writeSessionNoteFile({
        campaignId: note.campaignId,
        slug: note.slug,
        title: note.title,
        contentMd: note.contentMd ?? '',
        isDmOnly: !!note.isDmOnly,
      });
      if (!written) throw new BadRequestError('Invalid slug');
    }

    return NextResponse.json({ message: 'Session note updated' });
  } catch (err) {
    return errorResponse('PUT /api/sessions', err);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    db.delete(sessionNotes)
      .where(eq(sessionNotes.id, requireNumber(body, 'id')))
      .run();
    return NextResponse.json({ message: 'Session note deleted' });
  } catch (err) {
    return errorResponse('DELETE /api/sessions', err);
  }
}
