import { NextResponse } from 'next/server';
import { pollAllCampaigns } from '@/lib/content/poller';
import { requireAdmin } from '@/lib/auth';
import { jsonError, unauthorized } from '@/lib/api/responses';

export async function GET(request: Request) {
  try {
    const secret = process.env.POLL_SECRET;
    if (secret) {
      const header = request.headers.get('x-poll-secret');
      let isAdmin = false;
      try {
        await requireAdmin();
        isAdmin = true;
      } catch {}
      if (header !== secret && !isAdmin) {
        return unauthorized();
      }
    }
    await pollAllCampaigns();
    return NextResponse.json({ message: 'Content polled successfully' });
  } catch (err) {
    console.error('Poll error:', err);
    return jsonError('Poll failed', 500);
  }
}
