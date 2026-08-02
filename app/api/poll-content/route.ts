import { NextResponse } from 'next/server';
import { pollAllCampaigns } from '@/lib/content/poller';
import { requireAdmin } from '@/lib/auth';
import { errorResponse, isAuthError } from '@/lib/api-errors';

export async function GET(request: Request) {
  try {
    const secret = process.env.POLL_SECRET;
    if (secret) {
      const header = request.headers.get('x-poll-secret');
      let isAdmin = false;
      try {
        await requireAdmin();
        isAdmin = true;
      } catch (err) {
        if (!isAuthError(err)) throw err;
      }
      if (header !== secret && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    const { polled, failures } = await pollAllCampaigns();
    if (failures.length > 0) {
      return NextResponse.json(
        {
          message: `Polled ${polled} campaign(s), ${failures.length} failed`,
          polled,
          failures,
        },
        { status: 207 },
      );
    }
    return NextResponse.json({
      message: 'Content polled successfully',
      polled,
    });
  } catch (err) {
    return errorResponse('GET /api/poll-content', err);
  }
}
