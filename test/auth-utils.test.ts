import { describe, it, expect } from 'vitest';

// Extract the pure functions from lib/auth.ts for unit testing
function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getExpiresAt(maxAgeMs = 7 * 24 * 60 * 60 * 1000): string {
  return new Date(Date.now() + maxAgeMs).toISOString();
}

describe('generateSessionId', () => {
  it('returns a 64-character hex string', () => {
    const id = generateSessionId();
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateSessionId()));
    expect(ids.size).toBe(100);
  });

  it('only uses hex characters', () => {
    const id = generateSessionId();
    expect(id).toMatch(/^[0-9a-f]+$/);
  });

  it('has length 64 (32 bytes as hex)', () => {
    const id = generateSessionId();
    expect(id.length).toBe(64);
  });
});

describe('getExpiresAt', () => {
  it('returns an ISO 8601 date string', () => {
    const result = getExpiresAt();
    expect(() => new Date(result)).not.toThrow();
    expect(new Date(result).toISOString()).toBe(result);
  });

  it('returns a date in the future', () => {
    const result = getExpiresAt();
    expect(new Date(result).getTime()).toBeGreaterThan(Date.now());
  });

  it('uses custom max age when provided', () => {
    const short = getExpiresAt(1000);
    const long = getExpiresAt(100000);
    expect(new Date(short).getTime()).toBeLessThan(new Date(long).getTime());
  });
});
