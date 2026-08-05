import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { createMockDb } =
    await vi.importActual<typeof import('./helpers/mock-db')>(
      './helpers/mock-db',
    );
  return createMockDb();
});

const cookieStore = vi.hoisted(() => {
  const jar = new Map<string, string>();
  return {
    jar,
    get: vi.fn((name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    ),
    set: vi.fn((name: string, value: string) => {
      jar.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      jar.delete(name);
    }),
  };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(cookieStore)),
}));

import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import {
  createSession,
  destroySession,
  getSession,
  requireAdmin,
  requireAuth,
} from '@/lib/auth';

function seedUser(role = 'player') {
  db.insert(users)
    .values({ id: 1, username: 'player1', passwordHash: 'x', role })
    .run();
}

function seedSession(id: string, expiresAt: string, userId = 1) {
  db.insert(sessions).values({ id, userId, expiresAt }).run();
  cookieStore.jar.set('session_id', id);
}

describe('createSession', () => {
  beforeEach(() => {
    db.delete(sessions).run();
    db.delete(users).run();
    cookieStore.jar.clear();
    vi.clearAllMocks();
    seedUser();
  });

  it('persists the session and sets an httpOnly cookie', async () => {
    const sessionId = await createSession(1);

    expect(sessionId).toMatch(/^[0-9a-f]{64}$/);
    const rows = db.select().from(sessions).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: sessionId, userId: 1 });
    expect(cookieStore.set).toHaveBeenCalledWith(
      'session_id',
      sessionId,
      expect.objectContaining({ httpOnly: true, path: '/', sameSite: 'lax' }),
    );
  });

  it('stores an expiry roughly seven days in the future', async () => {
    const sessionId = await createSession(1);
    const row = db.select().from(sessions).all()[0];
    const deltaMs = new Date(row.expiresAt).getTime() - Date.now();
    expect(deltaMs).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
    expect(deltaMs).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
    expect(row.id).toBe(sessionId);
  });

  it('creates distinct sessions for repeated logins', async () => {
    const first = await createSession(1);
    const second = await createSession(1);
    expect(first).not.toBe(second);
    expect(db.select().from(sessions).all()).toHaveLength(2);
  });
});

describe('getSession', () => {
  beforeEach(() => {
    db.delete(sessions).run();
    db.delete(users).run();
    cookieStore.jar.clear();
    vi.clearAllMocks();
    seedUser();
  });

  it('returns null when no cookie is present', async () => {
    expect(await getSession()).toBeNull();
  });

  it('returns null when the cookie points at an unknown session', async () => {
    cookieStore.jar.set('session_id', 'does-not-exist');
    expect(await getSession()).toBeNull();
  });

  it('returns the user for a valid session', async () => {
    seedSession('valid', new Date(Date.now() + 60_000).toISOString());
    const session = await getSession();
    expect(session?.user).toMatchObject({ id: 1, username: 'player1' });
  });

  it('returns null and deletes the row for an expired session', async () => {
    seedSession('expired', new Date(Date.now() - 60_000).toISOString());
    expect(await getSession()).toBeNull();
    expect(db.select().from(sessions).all()).toHaveLength(0);
  });

  it('resolves the user referenced by the session, not the first user', async () => {
    db.insert(users)
      .values({ id: 2, username: 'player2', passwordHash: 'x' })
      .run();
    seedSession('valid', new Date(Date.now() + 60_000).toISOString(), 2);
    const session = await getSession();
    expect(session?.user).toMatchObject({ id: 2, username: 'player2' });
  });
});

describe('destroySession', () => {
  beforeEach(() => {
    db.delete(sessions).run();
    db.delete(users).run();
    cookieStore.jar.clear();
    vi.clearAllMocks();
    seedUser();
  });

  it('deletes the session row and clears the cookie', async () => {
    seedSession('live', new Date(Date.now() + 60_000).toISOString());
    await destroySession();
    expect(db.select().from(sessions).all()).toHaveLength(0);
    expect(cookieStore.delete).toHaveBeenCalledWith('session_id');
  });

  it('clears the cookie even when there is no session cookie', async () => {
    await destroySession();
    expect(cookieStore.delete).toHaveBeenCalledWith('session_id');
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    db.delete(sessions).run();
    db.delete(users).run();
    cookieStore.jar.clear();
    vi.clearAllMocks();
  });

  it('throws when there is no session', async () => {
    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });

  it('returns the session when authenticated', async () => {
    seedUser();
    seedSession('live', new Date(Date.now() + 60_000).toISOString());
    await expect(requireAuth()).resolves.toMatchObject({
      user: { id: 1, role: 'player' },
    });
  });
});

describe('requireAdmin', () => {
  beforeEach(() => {
    db.delete(sessions).run();
    db.delete(users).run();
    cookieStore.jar.clear();
    vi.clearAllMocks();
  });

  it('throws Unauthorized when there is no session', async () => {
    await expect(requireAdmin()).rejects.toThrow('Unauthorized');
  });

  it('throws Forbidden for a non-admin user', async () => {
    seedUser('player');
    seedSession('live', new Date(Date.now() + 60_000).toISOString());
    await expect(requireAdmin()).rejects.toThrow('Forbidden');
  });

  it('returns the user for an admin', async () => {
    seedUser('admin');
    seedSession('live', new Date(Date.now() + 60_000).toISOString());
    await expect(requireAdmin()).resolves.toMatchObject({ role: 'admin' });
  });
});
