import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  destroySession: vi.fn(() => Promise.resolve()),
}));

import { destroySession } from '@/lib/auth';
import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(destroySession).mockResolvedValue(undefined);
  });

  it('destroys the session and confirms logout', async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: 'Logged out' });
    expect(destroySession).toHaveBeenCalledOnce();
  });

  it('is idempotent across repeated calls', async () => {
    await POST();
    const res = await POST();
    expect(res.status).toBe(200);
    expect(destroySession).toHaveBeenCalledTimes(2);
  });
});
