import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/sessions/route';

vi.mock('@/lib/db', async () => {
  const { default: Database } =
    await vi.importActual<typeof import('better-sqlite3')>('better-sqlite3');
  const { drizzle } = await vi.importActual<
    typeof import('drizzle-orm/better-sqlite3')
  >('drizzle-orm/better-sqlite3');
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE session_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id INTEGER NOT NULL, slug TEXT NOT NULL, title TEXT NOT NULL, content_md TEXT NOT NULL DEFAULT '', author_id INTEGER, source TEXT NOT NULL DEFAULT 'in-app', is_dm_only INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(campaign_id, slug));
    CREATE TABLE characters (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, campaign_id INTEGER NOT NULL, name TEXT NOT NULL, info TEXT NOT NULL DEFAULT '', is_approved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  `);
  return { db: drizzle(sqlite) };
});

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

import { db } from '@/lib/db';

let sessionNotes: any, characters: any;

async function getTables() {
  const schema = await import('@/lib/db/schema');
  sessionNotes = schema.sessionNotes;
  characters = schema.characters;
}

function seedNotes() {
  db.insert(sessionNotes)
    .values({
      campaignId: 1,
      slug: 'session-001',
      title: 'Session One',
      contentMd: 'Notes',
      isDmOnly: false,
    })
    .run();
  db.insert(sessionNotes)
    .values({
      campaignId: 1,
      slug: 'session-002',
      title: 'Session Two',
      contentMd: 'Secret DM notes',
      isDmOnly: true,
    })
    .run();
}

describe('GET /api/sessions', () => {
  beforeEach(async () => {
    await getTables();
    db.delete(sessionNotes).run();
    db.delete(characters).run();
  });

  it('returns 401 when unauthorized', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockRejectedValue(new Error('Unauthorized'));
    const res = await GET(
      new Request('http://localhost/api/sessions?campaignId=1'),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 without campaignId or characterId', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockResolvedValue({
      user: { id: 5, username: 'player1', role: 'player' },
    });
    const res = await GET(new Request('http://localhost/api/sessions'));
    expect(res.status).toBe(400);
  });

  it('returns sessions for a campaign (admin)', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockResolvedValue({
      user: { id: 1, username: 'admin', role: 'admin' },
    });
    seedNotes();
    const res = await GET(
      new Request('http://localhost/api/sessions?campaignId=1'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it('returns 400 for invalid campaignId', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockResolvedValue({
      user: { id: 1, username: 'admin', role: 'admin' },
    });
    const res = await GET(
      new Request('http://localhost/api/sessions?campaignId=abc'),
    );
    expect(res.status).toBe(400);
  });

  it('returns only non-DM-only sessions for a character (player view)', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockResolvedValue({
      user: { id: 5, username: 'player1', role: 'player' },
    });
    db.insert(characters)
      .values({
        id: 10,
        userId: 5,
        campaignId: 1,
        name: 'Hero',
        isApproved: true,
      })
      .run();
    seedNotes();
    const res = await GET(
      new Request('http://localhost/api/sessions?characterId=10'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].slug).toBe('session-001');
  });

  it('shows all sessions for admin viewing via characterId', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockResolvedValue({
      user: { id: 1, username: 'admin', role: 'admin' },
    });
    db.insert(characters)
      .values({
        id: 11,
        userId: 1,
        campaignId: 1,
        name: 'Hero',
        isApproved: true,
      })
      .run();
    seedNotes();
    const res = await GET(
      new Request('http://localhost/api/sessions?characterId=11'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it('returns 400 for invalid characterId', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockResolvedValue({
      user: { id: 5, username: 'player1', role: 'player' },
    });
    const res = await GET(
      new Request('http://localhost/api/sessions?characterId=abc'),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when character not owned by user', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockResolvedValue({
      user: { id: 5, username: 'player1', role: 'player' },
    });
    db.insert(characters)
      .values({
        id: 20,
        userId: 999,
        campaignId: 1,
        name: 'Not Mine',
        isApproved: true,
      })
      .run();
    const res = await GET(
      new Request('http://localhost/api/sessions?characterId=20'),
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when character does not exist', async () => {
    const auth = await import('@/lib/auth');
    vi.mocked(auth.requireAuth).mockResolvedValue({
      user: { id: 5, username: 'player1', role: 'player' },
    });
    const res = await GET(
      new Request('http://localhost/api/sessions?characterId=999'),
    );
    expect(res.status).toBe(404);
  });
});
