import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '@/app/api/campaigns/route';
import { THEMES } from '@/lib/themes';

vi.mock('@/lib/db', async () => {
  const { default: Database } =
    await vi.importActual<typeof import('better-sqlite3')>('better-sqlite3');
  const { drizzle } = await vi.importActual<
    typeof import('drizzle-orm/better-sqlite3')
  >('drizzle-orm/better-sqlite3');
  const schemaMod =
    await vi.importActual<typeof import('@/lib/db/schema')>('@/lib/db/schema');
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE campaigns (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', lore_repo_url TEXT NOT NULL DEFAULT '', theme TEXT NOT NULL DEFAULT 'techno', is_hidden INTEGER NOT NULL DEFAULT 0, star_map_config TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')));
  `);
  return { db: drizzle(sqlite, { schema: schemaMod }) };
});

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(() =>
    Promise.resolve({ id: 1, username: 'admin', role: 'admin' }),
  ),
  requireAuth: vi.fn(() =>
    Promise.resolve({ user: { id: 1, username: 'admin', role: 'admin' } }),
  ),
}));

import * as schema from '@/lib/db/schema';
import { db } from '@/lib/db';
import { requireAdmin, requireAuth } from '@/lib/auth';

const REPO_URL = 'https://example.com/org/lore.git';

const originalInsert = db.insert.bind(db);
let insertSpy: ReturnType<typeof vi.spyOn> | undefined;

function captureInsertValues() {
  const calls: any[] = [];
  insertSpy = vi.spyOn(db, 'insert').mockImplementation((table: any) => {
    const builder = originalInsert(table);
    const originalValues = builder.values.bind(builder);
    builder.values = (values: any) => {
      calls.push(values);
      return originalValues(values);
    };
    return builder;
  });
  return calls;
}

describe('GET /api/campaigns', () => {
  beforeEach(() => {
    db.delete(schema.campaigns).run();
    vi.clearAllMocks();
  });

  it('returns empty array', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('returns all campaigns for an admin', async () => {
    db.insert(schema.campaigns)
      .values({ name: 'C1', loreRepoUrl: REPO_URL })
      .run();
    db.insert(schema.campaigns)
      .values({ name: 'C2', loreRepoUrl: REPO_URL })
      .run();
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it('rejects unauthenticated callers', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Unauthorized'));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('hides repo URLs and hidden campaigns from players', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({
      user: { id: 2, username: 'player', role: 'player' },
    } as Awaited<ReturnType<typeof requireAuth>>);
    db.insert(schema.campaigns)
      .values({ name: 'Visible', loreRepoUrl: REPO_URL })
      .run();
    db.insert(schema.campaigns)
      .values({ name: 'Secret', loreRepoUrl: REPO_URL, isHidden: true })
      .run();
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Visible');
    expect(body[0].loreRepoUrl).toBeUndefined();
  });
});

describe('POST /api/campaigns', () => {
  beforeEach(() => {
    db.delete(schema.campaigns).run();
    vi.clearAllMocks();
  });

  afterEach(() => {
    insertSpy?.mockRestore();
    insertSpy = undefined;
  });

  it('rejects non-admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'));
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope', loreRepoUrl: REPO_URL }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates a campaign', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Campaign', loreRepoUrl: REPO_URL }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects a repo URL git would treat as a command', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Evil',
        loreRepoUrl: 'ext::sh -c touch% /tmp/pwned',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(db.select().from(schema.campaigns).all()).toHaveLength(0);
  });

  it('sets default values', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Default', loreRepoUrl: REPO_URL }),
    });
    await POST(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('techno');
    expect(c.isHidden).toBe(false);
  });

  it('passes a concrete default theme to the insert when theme is omitted on create', async () => {
    const calls = captureInsertValues();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'NoTheme', loreRepoUrl: REPO_URL }),
    });
    await POST(req);
    expect(calls).toHaveLength(1);
    expect(calls[0].theme).toBe('techno');
  });

  it('passes a concrete default theme to the insert when theme is null on create', async () => {
    const calls = captureInsertValues();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'NullTheme',
        loreRepoUrl: REPO_URL,
        theme: null,
      }),
    });
    await POST(req);
    expect(calls[0].theme).toBe('techno');
  });
});

describe('PUT /api/campaigns', () => {
  beforeEach(() => {
    db.delete(schema.campaigns).run();
    vi.clearAllMocks();
  });

  it('updates a campaign', async () => {
    db.insert(schema.campaigns)
      .values({ name: 'Old', loreRepoUrl: REPO_URL })
      .run();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        name: 'Updated',
        loreRepoUrl: REPO_URL,
        description: '',
        theme: 'forest',
        isHidden: false,
        starMapConfig: '{}',
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.name).toBe('Updated');
    expect(c.theme).toBe('forest');
  });
});

describe('DELETE /api/campaigns', () => {
  beforeEach(() => {
    db.delete(schema.campaigns).run();
    vi.clearAllMocks();
  });

  it('deletes a campaign', async () => {
    db.insert(schema.campaigns)
      .values({ name: 'Delete me', loreRepoUrl: REPO_URL })
      .run();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1 }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(db.select().from(schema.campaigns).all()).toHaveLength(0);
  });
});

describe('POST /api/campaigns theme validation', () => {
  beforeEach(() => {
    db.delete(schema.campaigns).run();
    vi.clearAllMocks();
  });

  it('accepts every valid theme', async () => {
    for (const theme of THEMES) {
      const req = new Request('http://localhost/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Campaign ${theme}`,
          loreRepoUrl: REPO_URL,
          theme,
        }),
      });
      await POST(req);
      const stored = db.select().from(schema.campaigns).all();
      expect(stored[stored.length - 1].theme).toBe(theme);
    }
  });

  it('coerces an unknown theme to techno', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad',
        loreRepoUrl: REPO_URL,
        theme: 'ocean',
      }),
    });
    await POST(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('techno');
  });

  it('coerces a legacy theme name to its new key on create', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Old',
        loreRepoUrl: REPO_URL,
        theme: 'sci-fi',
      }),
    });
    await POST(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('techno');
  });

  it('coerces an unknown theme to techno on update', async () => {
    db.insert(schema.campaigns)
      .values({ name: 'Old', loreRepoUrl: REPO_URL })
      .run();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        name: 'Updated',
        loreRepoUrl: REPO_URL,
        description: '',
        theme: 'ocean',
        isHidden: false,
        starMapConfig: '{}',
      }),
    });
    await PUT(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('techno');
  });

  it('does not change theme when theme is omitted on update', async () => {
    db.insert(schema.campaigns)
      .values({ name: 'Forest', loreRepoUrl: REPO_URL, theme: 'forest' })
      .run();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        name: 'Forest',
        loreRepoUrl: REPO_URL,
        description: '',
        isHidden: false,
        starMapConfig: '{}',
      }),
    });
    await PUT(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('forest');
  });

  it('does not change theme when theme is null on update', async () => {
    db.insert(schema.campaigns)
      .values({ name: 'Forest', loreRepoUrl: REPO_URL, theme: 'forest' })
      .run();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        name: 'Forest',
        loreRepoUrl: REPO_URL,
        description: '',
        theme: null,
        isHidden: false,
        starMapConfig: '{}',
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('forest');
  });
});
