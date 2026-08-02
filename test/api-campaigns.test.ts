import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '@/app/api/campaigns/route';

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
    CREATE TABLE campaigns (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', lore_repo_url TEXT NOT NULL DEFAULT '', theme TEXT NOT NULL DEFAULT 'sci-fi', is_hidden INTEGER NOT NULL DEFAULT 0, star_map_config TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')));
  `);
  return { db: drizzle(sqlite, { schema: schemaMod }) };
});

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(() =>
    Promise.resolve({ id: 1, username: 'admin', role: 'admin' }),
  ),
}));

import * as schema from '@/lib/db/schema';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

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

  it('returns all campaigns', async () => {
    db.insert(schema.campaigns).values({ name: 'C1', loreRepoUrl: 'x' }).run();
    db.insert(schema.campaigns).values({ name: 'C2', loreRepoUrl: 'y' }).run();
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
  });
});

describe('POST /api/campaigns', () => {
  beforeEach(() => {
    db.delete(schema.campaigns).run();
    vi.clearAllMocks();
  });

  it('rejects non-admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Forbidden'));
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope', loreRepoUrl: 'x' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates a campaign', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Campaign', loreRepoUrl: 'git:...' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('sets default values', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Default', loreRepoUrl: 'git:...' }),
    });
    await POST(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('techno');
    expect(c.isHidden).toBe(false);
  });
});

describe('PUT /api/campaigns', () => {
  beforeEach(() => {
    db.delete(schema.campaigns).run();
    vi.clearAllMocks();
  });

  it('updates a campaign', async () => {
    db.insert(schema.campaigns).values({ name: 'Old', loreRepoUrl: 'x' }).run();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        name: 'Updated',
        loreRepoUrl: 'x',
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
      .values({ name: 'Delete me', loreRepoUrl: 'x' })
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

  it('accepts any valid theme', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Forest', loreRepoUrl: 'x', theme: 'forest' }),
    });
    await POST(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('forest');
  });

  it('coerces an unknown theme to techno', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bad', loreRepoUrl: 'x', theme: 'ocean' }),
    });
    await POST(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('techno');
  });

  it('coerces a legacy theme name to its new key on create', async () => {
    const req = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Old', loreRepoUrl: 'x', theme: 'sci-fi' }),
    });
    await POST(req);
    const c = db.select().from(schema.campaigns).get()!;
    expect(c.theme).toBe('techno');
  });

  it('coerces an unknown theme to techno on update', async () => {
    db.insert(schema.campaigns).values({ name: 'Old', loreRepoUrl: 'x' }).run();
    const req = new Request('http://localhost/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        name: 'Updated',
        loreRepoUrl: 'x',
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
});
