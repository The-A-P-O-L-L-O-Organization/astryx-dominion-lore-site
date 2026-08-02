import { describe, it, expect, vi } from 'vitest';
import {
  badRequest,
  jsonError,
  notFound,
  parseNumericId,
  serverError,
  unauthorized,
  withGuard,
} from '@/lib/api/responses';

async function body(res: Response) {
  return res.json();
}

describe('json error helpers', () => {
  it('builds an error payload with the given status', async () => {
    const res = jsonError('Boom', 418);
    expect(res.status).toBe(418);
    expect(await body(res)).toEqual({ error: 'Boom' });
  });

  it('provides defaults for common statuses', async () => {
    expect(badRequest().status).toBe(400);
    expect(await body(badRequest())).toEqual({ error: 'Bad request' });
    expect(unauthorized().status).toBe(401);
    expect(await body(unauthorized())).toEqual({ error: 'Unauthorized' });
    expect(notFound().status).toBe(404);
    expect(serverError().status).toBe(500);
    expect(await body(serverError())).toEqual({
      error: 'Internal server error',
    });
  });
});

describe('parseNumericId', () => {
  it('parses numeric strings and numbers', () => {
    expect(parseNumericId('42')).toBe(42);
    expect(parseNumericId(7)).toBe(7);
  });

  it('returns null for missing or non-numeric values', () => {
    expect(parseNumericId(null)).toBeNull();
    expect(parseNumericId(undefined)).toBeNull();
    expect(parseNumericId('abc')).toBeNull();
  });
});

describe('withGuard', () => {
  it('passes the guard result to the handler', async () => {
    const res = await withGuard(
      () => Promise.resolve({ user: { role: 'admin' } }),
      (guarded) => jsonError(guarded.user.role, 200),
    );
    expect(await body(res)).toEqual({ error: 'admin' });
  });

  it('returns 401 when the guard rejects', async () => {
    const handler = vi.fn();
    const res = await withGuard(
      () => Promise.reject(new Error('Unauthorized')),
      handler,
    );
    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  it('returns 401 when the handler throws', async () => {
    const res = await withGuard(
      () => Promise.resolve(null),
      () => {
        throw new Error('bad json');
      },
    );
    expect(res.status).toBe(401);
  });
});
