import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('@/lib/db', async () => {
  const { default: Database } =
    await vi.importActual<typeof import('better-sqlite3')>('better-sqlite3');
  const { drizzle } = await vi.importActual<
    typeof import('drizzle-orm/better-sqlite3')
  >('drizzle-orm/better-sqlite3');
  const sqlite = new Database(':memory:');
  sqlite.exec(
    `CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'player', created_at TEXT NOT NULL DEFAULT (datetime('now')));`,
  );
  return { db: drizzle(sqlite) };
});

vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn((p: string) => Promise.resolve(`hashed:${p}`)),
}));

import { POST as registerHandler } from '@/app/api/auth/register/route';
import * as schema from '@/lib/db/schema';
import { db } from '@/lib/db';

let ipCounter = 0;
function uniqueReq(url: string, body: Record<string, string>): Request {
  ipCounter++;
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `127.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    db.delete(schema.users).run();
    vi.clearAllMocks();
  });

  it('registers a new user', async () => {
    const req = uniqueReq('http://localhost/api/auth/register', {
      username: 'newuser',
      password: 'password123',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe('Account created');
  });

  it('gives admin role to first registered user', async () => {
    const req = uniqueReq('http://localhost/api/auth/register', {
      username: 'admin',
      password: 'password123',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, 'admin'))
      .get();
    expect(user!.role).toBe('admin');
  });

  it('gives player role to subsequent users', async () => {
    db.insert(schema.users)
      .values({ username: 'first', passwordHash: 'hash', role: 'admin' })
      .run();
    const req = uniqueReq('http://localhost/api/auth/register', {
      username: 'second',
      password: 'password123',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, 'second'))
      .get();
    expect(user!.role).toBe('player');
  });

  it('rejects duplicate username', async () => {
    db.insert(schema.users)
      .values({ username: 'existing', passwordHash: 'hash', role: 'player' })
      .run();
    const req = uniqueReq('http://localhost/api/auth/register', {
      username: 'existing',
      password: 'password123',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(409);
  });

  it('rejects short password (< 6 chars)', async () => {
    const req = uniqueReq('http://localhost/api/auth/register', {
      username: 'user',
      password: '12345',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(400);
  });

  it('rejects empty username', async () => {
    const req = uniqueReq('http://localhost/api/auth/register', {
      username: '',
      password: 'password123',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(400);
  });
});
