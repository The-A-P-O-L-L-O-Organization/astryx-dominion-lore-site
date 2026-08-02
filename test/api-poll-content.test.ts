import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/content/poller', () => ({
  pollAllCampaigns: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
}));

import { pollAllCampaigns } from '@/lib/content/poller';
import { requireAdmin } from '@/lib/auth';
import { GET } from '@/app/api/poll-content/route';

function request(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/poll-content', { headers });
}

describe('GET /api/poll-content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.POLL_SECRET;
    vi.mocked(pollAllCampaigns).mockResolvedValue(undefined);
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
  });

  afterEach(() => {
    delete process.env.POLL_SECRET;
    vi.restoreAllMocks();
  });

  it('polls without auth when no secret is configured', async () => {
    const res = await GET(request());
    expect(res.status).toBe(200);
    expect(pollAllCampaigns).toHaveBeenCalledOnce();
  });

  it('returns 401 when the secret is configured but not supplied', async () => {
    process.env.POLL_SECRET = 's3cret';
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(pollAllCampaigns).not.toHaveBeenCalled();
  });

  it('returns 401 when the supplied secret is wrong', async () => {
    process.env.POLL_SECRET = 's3cret';
    const res = await GET(request({ 'x-poll-secret': 'nope' }));
    expect(res.status).toBe(401);
    expect(pollAllCampaigns).not.toHaveBeenCalled();
  });

  it('polls when the correct secret header is supplied', async () => {
    process.env.POLL_SECRET = 's3cret';
    const res = await GET(request({ 'x-poll-secret': 's3cret' }));
    expect(res.status).toBe(200);
    expect(pollAllCampaigns).toHaveBeenCalledOnce();
  });

  it('polls for an admin even without the secret header', async () => {
    process.env.POLL_SECRET = 's3cret';
    vi.mocked(requireAdmin).mockResolvedValue({ role: 'admin' } as never);
    const res = await GET(request());
    expect(res.status).toBe(200);
    expect(pollAllCampaigns).toHaveBeenCalledOnce();
  });

  it('returns 500 when polling throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(pollAllCampaigns).mockRejectedValue(new Error('git exploded'));
    const res = await GET(request());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Poll failed' });
  });
});
