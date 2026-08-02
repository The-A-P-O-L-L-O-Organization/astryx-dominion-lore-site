import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionNotes, characters } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import {
  BadRequestError,
  errorResponse,
  optionalString,
  parseJsonBody,
  requireNumber,
  requireString,
} from '@/lib/api-errors';

const CONTENT_DIR = process.env.CONTENT_DIR || '/data/repos';

function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const characterId = searchParams.get('characterId');

  try {
    const { user } = await requireAuth();

    let notes;
    if (characterId) {
      const characterIdNum = Number(characterId);
      if (isNaN(characterIdNum))
        return NextResponse.json(
          { error: 'Invalid character ID' },
          { status: 400 },
        );
      const character = db
        .select()
        .from(characters)
        .where(eq(characters.id, characterIdNum))
        .get();
      if (!character || character.userId !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (user.role === 'admin') {
        notes = db
          .select()
          .from(sessionNotes)
          .where(eq(sessionNotes.campaignId, character.campaignId))
          .all();
      } else {
        notes = db
          .select()
          .from(sessionNotes)
          .where(
            and(
              eq(sessionNotes.campaignId, character.campaignId),
              eq(sessionNotes.isDmOnly, false),
            ),
          )
          .all();
      }
    } else if (campaignId && user.role === 'admin') {
      const campaignIdNum = Number(campaignId);
      if (isNaN(campaignIdNum))
        return NextResponse.json(
          { error: 'Invalid campaign ID' },
          { status: 400 },
        );
      notes = db
        .select()
        .from(sessionNotes)
        .where(eq(sessionNotes.campaignId, campaignIdNum))
        .all();
    } else {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    return NextResponse.json(notes);
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

    const repoDir = path.join(
      CONTENT_DIR,
      String(campaignIdNum),
      'session-notes',
    );
    if (!existsSync(repoDir)) await mkdir(repoDir, { recursive: true });
    const repoDirResolved = path.resolve(repoDir);
    const notePath = path.resolve(repoDirResolved, `${slug}.md`);
    if (!notePath.startsWith(repoDirResolved + path.sep)) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    await writeFile(
      notePath,
      `---\ntitle: ${title}\nis_dm_only: ${isDmOnly}\nslug: ${slug}\n---\n\n${contentMd}`,
    );

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
    const title = requireString(body, 'title');
    const contentMd = optionalString(body, 'contentMd');
    const isDmOnly = !!body.isDmOnly;

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
      const repoDir = path.join(
        CONTENT_DIR,
        String(note.campaignId),
        'session-notes',
      );
      if (!existsSync(repoDir)) await mkdir(repoDir, { recursive: true });
      const safeSlug = sanitizeSlug(note.slug);
      const repoDirResolved = path.resolve(repoDir);
      const notePath = path.resolve(repoDirResolved, `${safeSlug}.md`);
      if (!notePath.startsWith(repoDirResolved + path.sep)) {
        return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
      }
      await writeFile(
        notePath,
        `---\ntitle: ${title}\nis_dm_only: ${isDmOnly}\nslug: ${note.slug}\n---\n\n${contentMd}`,
      );
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
