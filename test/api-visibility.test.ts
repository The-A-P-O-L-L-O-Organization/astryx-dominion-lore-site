import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '@/app/api/visibility/route';

vi.mock('@/lib/db', async () => {
  const { default: Database } =
    await vi.importActual<typeof import('better-sqlite3')>('better-sqlite3');
  const { drizzle } = await vi.importActual<
    typeof import('drizzle-orm/better-sqlite3')
  >('drizzle-orm/better-sqlite3');
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE page_visibility (id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id INTEGER NOT NULL, page_path TEXT NOT NULL, is_hidden INTEGER NOT NULL DEFAULT 1, UNIQUE(campaign_id, page_path));
    CREATE TABLE section_visibility (id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id INTEGER NOT NULL, page_path TEXT NOT NULL, section_id TEXT NOT NULL, is_hidden INTEGER NOT NULL DEFAULT 1, UNIQUE(campaign_id, page_path, section_id));
  `);
  return { db: drizzle(sqlite) };
});

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(() =>
    Promise.resolve({ id: 1, username: 'admin', role: 'admin' }),
  ),
}));

import * as schema from '@/lib/db/schema';
import { db } from '@/lib/db';

describe('GET /api/visibility', () => {
  beforeEach(() => {
    db.delete(schema.pageVisibility).run();
    db.delete(schema.sectionVisibility).run();
    vi.clearAllMocks();
  });

  it('requires campaignId', async () => {
    const req = new Request('http://localhost/api/visibility');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns pages and sections for a campaign', async () => {
    db.insert(schema.pageVisibility)
      .values({ campaignId: 1, pagePath: 'factions', isHidden: false })
      .run();
    db.insert(schema.pageVisibility)
      .values({ campaignId: 1, pagePath: 'planets', isHidden: true })
      .run();
    db.insert(schema.sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'history',
        isHidden: false,
      })
      .run();
    db.insert(schema.sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'secrets',
        isHidden: true,
      })
      .run();

    const req = new Request('http://localhost/api/visibility?campaignId=1');
    const res = await GET(req);
    const body = await res.json();
    expect(body.pages).toHaveLength(2);
    expect(body.sections).toHaveLength(2);
  });

  it('filters by campaignId', async () => {
    db.insert(schema.pageVisibility)
      .values({ campaignId: 1, pagePath: 'pg1' })
      .run();
    db.insert(schema.pageVisibility)
      .values({ campaignId: 2, pagePath: 'pg2' })
      .run();
    const req = new Request('http://localhost/api/visibility?campaignId=1');
    const res = await GET(req);
    const body = await res.json();
    expect(body.pages).toHaveLength(1);
    expect(body.pages[0].pagePath).toBe('pg1');
  });
});

describe('PUT /api/visibility', () => {
  beforeEach(() => {
    db.delete(schema.pageVisibility).run();
    db.delete(schema.sectionVisibility).run();
    vi.clearAllMocks();
  });

  it('toggles page visibility', async () => {
    db.insert(schema.pageVisibility)
      .values({ campaignId: 1, pagePath: 'factions', isHidden: true })
      .run();
    const req = new Request('http://localhost/api/visibility', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page',
        campaignId: 1,
        pagePath: 'factions',
        isHidden: false,
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const p = db.select().from(schema.pageVisibility).get()!;
    expect(p.isHidden).toBe(false);
  });

  it('toggles section visibility', async () => {
    db.insert(schema.sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'secrets',
        isHidden: true,
      })
      .run();
    const req = new Request('http://localhost/api/visibility', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'section',
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'secrets',
        isHidden: false,
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const s = db.select().from(schema.sectionVisibility).get()!;
    expect(s.isHidden).toBe(false);
  });
});
