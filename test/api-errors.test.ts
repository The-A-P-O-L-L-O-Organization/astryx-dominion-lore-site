import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  AuthError,
  BadRequestError,
  errorResponse,
  isAuthError,
  optionalString,
  parseJsonBody,
  requireNumber,
  requireString,
} from '@/lib/api-errors';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isAuthError', () => {
  it('recognises AuthError and legacy auth messages', () => {
    expect(isAuthError(new AuthError())).toBe(true);
    expect(isAuthError(new Error('Unauthorized'))).toBe(true);
    expect(isAuthError(new Error('Forbidden'))).toBe(true);
    expect(isAuthError(new Error('SQLITE_BUSY'))).toBe(false);
  });
});

describe('errorResponse', () => {
  it('returns 401 for auth failures without logging', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = errorResponse('ctx', new AuthError('Forbidden'));
    expect(res.status).toBe(401);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns 400 with the message for bad requests', async () => {
    const res = errorResponse('ctx', new BadRequestError('name is required'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'name is required' });
  });

  it('logs and returns 500 for unexpected errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('database is locked');
    const res = errorResponse('POST /api/thing', err);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: 'Internal server error',
    });
    expect(spy).toHaveBeenCalledWith('POST /api/thing failed:', err);
  });
});

describe('parseJsonBody', () => {
  it('rejects malformed JSON', async () => {
    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: 'not json',
    });
    await expect(parseJsonBody(req)).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects non-object bodies', async () => {
    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: JSON.stringify([1, 2]),
    });
    await expect(parseJsonBody(req)).rejects.toBeInstanceOf(BadRequestError);
  });

  it('returns the parsed object', async () => {
    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: JSON.stringify({ name: 'x' }),
    });
    await expect(parseJsonBody(req)).resolves.toEqual({ name: 'x' });
  });
});

describe('field helpers', () => {
  it('requireString rejects missing or blank values', () => {
    expect(() => requireString({}, 'name')).toThrow(BadRequestError);
    expect(() => requireString({ name: '  ' }, 'name')).toThrow(
      BadRequestError,
    );
    expect(requireString({ name: 'ok' }, 'name')).toBe('ok');
  });

  it('requireNumber rejects non-numeric values', () => {
    expect(() => requireNumber({ id: 'abc' }, 'id')).toThrow(BadRequestError);
    expect(requireNumber({ id: '7' }, 'id')).toBe(7);
  });

  it('optionalString falls back', () => {
    expect(optionalString({}, 'theme', 'sci-fi')).toBe('sci-fi');
    expect(optionalString({ theme: 'fantasy' }, 'theme', 'sci-fi')).toBe(
      'fantasy',
    );
  });
});
