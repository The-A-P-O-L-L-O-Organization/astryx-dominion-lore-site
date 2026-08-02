import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getClientIp, isRateLimited, resetRateLimits } from '@/lib/rate-limit';

describe('isRateLimited', () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to the limit and blocks afterwards', () => {
    expect(isRateLimited('k', 2, 1000)).toBe(false);
    expect(isRateLimited('k', 2, 1000)).toBe(false);
    expect(isRateLimited('k', 2, 1000)).toBe(true);
  });

  it('tracks keys independently', () => {
    expect(isRateLimited('a', 1, 1000)).toBe(false);
    expect(isRateLimited('b', 1, 1000)).toBe(false);
    expect(isRateLimited('a', 1, 1000)).toBe(true);
  });

  it('resets once the window elapses', () => {
    expect(isRateLimited('k', 1, 1000)).toBe(false);
    expect(isRateLimited('k', 1, 1000)).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(isRateLimited('k', 1, 1000)).toBe(false);
  });
});

describe('getClientIp', () => {
  it('uses the first x-forwarded-for entry', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip then unknown', () => {
    expect(
      getClientIp(
        new Request('http://localhost', {
          headers: { 'x-real-ip': '9.9.9.9' },
        }),
      ),
    ).toBe('9.9.9.9');
    expect(getClientIp(new Request('http://localhost'))).toBe('unknown');
  });
});
