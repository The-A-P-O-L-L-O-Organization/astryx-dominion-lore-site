import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { createMockDb } =
    await vi.importActual<typeof import('./helpers/mock-db')>(
      './helpers/mock-db',
    );
  return createMockDb();
});

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));

import { db } from '@/lib/db';
import { campaigns, characters, users } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth';
import { PUT, DELETE } from '@/app/api/characters/route';

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/characters', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function seed() {
  db.delete(characters).run();
  db.delete(campaigns).run();
  db.delete(users).run();
  db.insert(users)
    .values({ id: 1, username: 'player1', passwordHash: 'x' })
    .run();
  db.insert(campaigns)
    .values({ id: 1, name: 'Astryx', loreRepoUrl: 'https://example.com' })
    .run();
  db.insert(characters)
    .values({ id: 3, userId: 1, campaignId: 1, name: 'Hero', info: '' })
    .run();
}

describe('PUT /api/characters', () => {
  beforeEach(() => {
    seed();
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      id: 1,
      username: 'admin',
      role: 'admin',
    } as never);
  });

  it('returns 401 for non-admins and leaves approval unchanged', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
    const res = await PUT(jsonRequest({ id: 3, isApproved: true }));
    expect(res.status).toBe(401);
    expect(db.select().from(characters).all()[0].isApproved).toBe(false);
  });

  it('approves a character', async () => {
    const res = await PUT(jsonRequest({ id: 3, isApproved: true }));
    expect(res.status).toBe(200);
    expect(db.select().from(characters).all()[0].isApproved).toBe(true);
  });

  it('revokes approval', async () => {
    await PUT(jsonRequest({ id: 3, isApproved: true }));
    const res = await PUT(jsonRequest({ id: 3, isApproved: false }));
    expect(res.status).toBe(200);
    expect(db.select().from(characters).all()[0].isApproved).toBe(false);
  });

  it('is a no-op for an unknown character', async () => {
    const res = await PUT(jsonRequest({ id: 999, isApproved: true }));
    expect(res.status).toBe(200);
    expect(db.select().from(characters).all()[0].isApproved).toBe(false);
  });

  it('returns 400 when the body is not valid JSON', async () => {
    const res = await PUT(
      new Request('http://localhost/api/characters', {
        method: 'PUT',
        body: 'not json',
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/characters', () => {
  beforeEach(() => {
    seed();
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      id: 1,
      username: 'admin',
      role: 'admin',
    } as never);
  });

  it('returns 401 for non-admins and keeps the character', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Forbidden'));
    const res = await DELETE(jsonRequest({ id: 3 }));
    expect(res.status).toBe(401);
    expect(db.select().from(characters).all()).toHaveLength(1);
  });

  it('deletes the character', async () => {
    const res = await DELETE(jsonRequest({ id: 3 }));
    expect(res.status).toBe(200);
    expect(db.select().from(characters).all()).toHaveLength(0);
  });

  it('is a no-op for an unknown character', async () => {
    const res = await DELETE(jsonRequest({ id: 999 }));
    expect(res.status).toBe(200);
    expect(db.select().from(characters).all()).toHaveLength(1);
  });
});
