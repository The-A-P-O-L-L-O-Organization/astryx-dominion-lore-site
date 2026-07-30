import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { GET as sessionHandler } from '@/app/api/auth/session/route';

const db = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'player', created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL);
  `);
  return drizzle(sqlite);
});

const mockCookies = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db }));
vi.mock('next/headers', () => ({ cookies: () => mockCookies }));

import * as schema from '@/lib/db/schema';

describe('POST /api/auth/logout', () => {
  it('returns 200 on logout', async () => {
    mockCookies.get.mockReturnValue({ value: 'test-session' });
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
    });
    const res = await logoutHandler(req);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    db.delete(schema.sessions).run();
    db.delete(schema.users).run();
  });

  it('returns 200 when valid session exists', async () => {
    db.insert(schema.users)
      .values({ username: 'testuser', passwordHash: 'hash', role: 'player' })
      .run();
    db.insert(schema.sessions)
      .values({
        id: 'valid-session',
        userId: 1,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })
      .run();

    mockCookies.get.mockReturnValue({ value: 'valid-session' });

    const req = new Request('http://localhost/api/auth/session');
    const res = await sessionHandler(req);
    expect(res.status).toBe(200);
  });

  it('returns user null when no session cookie', async () => {
    mockCookies.get.mockReturnValue(undefined);

    const req = new Request('http://localhost/api/auth/session');
    const res = await sessionHandler(req);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it('returns user null when session expired', async () => {
    db.insert(schema.users)
      .values({ username: 'testuser', passwordHash: 'hash', role: 'player' })
      .run();
    db.insert(schema.sessions)
      .values({
        id: 'expired-session',
        userId: 1,
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
      })
      .run();

    mockCookies.get.mockReturnValue({ value: 'expired-session' });

    const req = new Request('http://localhost/api/auth/session');
    const res = await sessionHandler(req);
    const body = await res.json();
    expect(body.user).toBeNull();
  });
});
