import { NextResponse } from 'next/server';
import { pollAllCampaigns } from '@/lib/content/poller';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    await pollAllCampaigns();
    return NextResponse.json({ message: 'Content polled successfully' });
  } catch (err) {
    console.error('Poll error:', err);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}
