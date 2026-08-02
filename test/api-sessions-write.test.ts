import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { readFileSync, existsSync, rmSync } from 'fs';
import path from 'path';

// CONTENT_DIR is read when the route module is first imported.
const contentRoot = vi.hoisted(() => {
  const dir = `${process.env.TMPDIR || '/tmp'}/api-sessions-${process.pid}-${Date.now()}`;
  process.env.CONTENT_DIR = dir;
  return dir;
});

vi.mock('@/lib/db', async () => {
  const { default: Database } =
    await vi.importActual<typeof import('better-sqlite3')>('better-sqlite3');
  const { drizzle } = await vi.importActual<
    typeof import('drizzle-orm/better-sqlite3')
  >('drizzle-orm/better-sqlite3');
  const schemaMod =
    await vi.importActual<typeof import('@/lib/db/schema')>('@/lib/db/schema');
  const ddlMod = await vi.importActual<typeof import('@/lib/db/schema-ddl')>(
    '@/lib/db/schema-ddl',
  );
  const sqlite = new Database(':memory:');
  sqlite.exec(ddlMod.schemaDdl);
  return { db: drizzle(sqlite, { schema: schemaMod }) };
});

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));

import { db } from '@/lib/db';
import { campaigns, sessionNotes } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth';
import { POST, PUT, DELETE } from '@/app/api/sessions/route';

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function asAdmin() {
  vi.mocked(requireAdmin).mockResolvedValue({
    id: 1,
    username: 'admin',
    role: 'admin',
  } as never);
}

function asNonAdmin() {
  vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
}

function noteFile(campaignId: number, slug: string) {
  return path.join(
    contentRoot,
    String(campaignId),
    'session-notes',
    `${slug}.md`,
  );
}

describe('POST /api/sessions', () => {
  beforeEach(() => {
    db.delete(sessionNotes).run();
    db.delete(campaigns).run();
    db.insert(campaigns)
      .values({ id: 1, name: 'Astryx', loreRepoUrl: 'https://example.com' })
      .run();
    rmSync(contentRoot, { recursive: true, force: true });
    vi.clearAllMocks();
    asAdmin();
  });

  afterAll(() => {
    rmSync(contentRoot, { recursive: true, force: true });
  });

  it('returns 401 for non-admins', async () => {
    asNonAdmin();
    const res = await POST(jsonRequest({ campaignId: 1, slug: 'a' }));
    expect(res.status).toBe(401);
    expect(db.select().from(sessionNotes).all()).toHaveLength(0);
  });

  it('returns 400 for a non-numeric campaign ID', async () => {
    const res = await POST(jsonRequest({ campaignId: 'abc', slug: 'a' }));
    expect(res.status).toBe(400);
  });

  it('creates the note row and writes a markdown file', async () => {
    const res = await POST(
      jsonRequest({
        campaignId: 1,
        slug: 'session-001',
        title: 'First',
        contentMd: 'Body text',
        isDmOnly: true,
      }),
    );
    expect(res.status).toBe(201);

    const notes = db.select().from(sessionNotes).all();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      campaignId: 1,
      slug: 'session-001',
      title: 'First',
      isDmOnly: true,
    });

    const file = readFileSync(noteFile(1, 'session-001'), 'utf-8');
    expect(file).toContain('title: First');
    expect(file).toContain('is_dm_only: true');
    expect(file).toContain('Body text');
  });

  it('strips unsafe characters from the slug before writing', async () => {
    const res = await POST(
      jsonRequest({
        campaignId: 1,
        slug: '../../escape me',
        title: 'Sneaky',
        contentMd: 'x',
      }),
    );
    expect(res.status).toBe(201);
    expect(db.select().from(sessionNotes).all()[0].slug).toBe('escapeme');
    expect(existsSync(noteFile(1, 'escapeme'))).toBe(true);
  });

  it('returns 401 when the insert violates the unique slug constraint', async () => {
    await POST(
      jsonRequest({ campaignId: 1, slug: 'dup', title: 'A', contentMd: 'x' }),
    );
    const res = await POST(
      jsonRequest({ campaignId: 1, slug: 'dup', title: 'B', contentMd: 'y' }),
    );
    expect(res.status).toBe(401);
    expect(db.select().from(sessionNotes).all()).toHaveLength(1);
  });
});

describe('PUT /api/sessions', () => {
  beforeEach(() => {
    db.delete(sessionNotes).run();
    db.delete(campaigns).run();
    db.insert(campaigns)
      .values({ id: 1, name: 'Astryx', loreRepoUrl: 'https://example.com' })
      .run();
    db.insert(sessionNotes)
      .values({
        id: 7,
        campaignId: 1,
        slug: 'session-001',
        title: 'Old title',
        contentMd: 'old',
      })
      .run();
    rmSync(contentRoot, { recursive: true, force: true });
    vi.clearAllMocks();
    asAdmin();
  });

  it('returns 401 for non-admins', async () => {
    asNonAdmin();
    const res = await PUT(jsonRequest({ id: 7, title: 'Nope' }));
    expect(res.status).toBe(401);
    expect(db.select().from(sessionNotes).all()[0].title).toBe('Old title');
  });

  it('updates the row and rewrites the markdown file', async () => {
    const res = await PUT(
      jsonRequest({
        id: 7,
        title: 'New title',
        contentMd: 'new body',
        isDmOnly: true,
      }),
    );
    expect(res.status).toBe(200);

    const note = db.select().from(sessionNotes).all()[0];
    expect(note).toMatchObject({
      title: 'New title',
      contentMd: 'new body',
      isDmOnly: true,
    });
    expect(note.updatedAt).not.toBe('');

    const file = readFileSync(noteFile(1, 'session-001'), 'utf-8');
    expect(file).toContain('title: New title');
    expect(file).toContain('new body');
  });

  it('succeeds without writing a file when the note does not exist', async () => {
    const res = await PUT(
      jsonRequest({ id: 999, title: 'Ghost', contentMd: 'x' }),
    );
    expect(res.status).toBe(200);
    expect(existsSync(path.join(contentRoot, '1'))).toBe(false);
  });
});

describe('DELETE /api/sessions', () => {
  beforeEach(() => {
    db.delete(sessionNotes).run();
    db.delete(campaigns).run();
    db.insert(campaigns)
      .values({ id: 1, name: 'Astryx', loreRepoUrl: 'https://example.com' })
      .run();
    db.insert(sessionNotes)
      .values({
        id: 7,
        campaignId: 1,
        slug: 'session-001',
        title: 'Old',
        contentMd: 'old',
      })
      .run();
    vi.clearAllMocks();
    asAdmin();
  });

  it('returns 401 for non-admins and keeps the note', async () => {
    asNonAdmin();
    const res = await DELETE(jsonRequest({ id: 7 }));
    expect(res.status).toBe(401);
    expect(db.select().from(sessionNotes).all()).toHaveLength(1);
  });

  it('deletes the note', async () => {
    const res = await DELETE(jsonRequest({ id: 7 }));
    expect(res.status).toBe(200);
    expect(db.select().from(sessionNotes).all()).toHaveLength(0);
  });

  it('is a no-op for an unknown id', async () => {
    const res = await DELETE(jsonRequest({ id: 999 }));
    expect(res.status).toBe(200);
    expect(db.select().from(sessionNotes).all()).toHaveLength(1);
  });
});
