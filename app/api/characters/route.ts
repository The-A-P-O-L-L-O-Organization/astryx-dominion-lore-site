import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters, campaigns } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { notFound, withGuard } from '@/lib/api/responses';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { user } = await requireAuth();
    const all =
      user.role === 'admin'
        ? db.select().from(characters).all()
        : db
            .select()
            .from(characters)
            .where(eq(characters.userId, user.id))
            .all();
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  return withGuard(requireAuth, async ({ user }) => {
    const body = await request.json();

    const campaignId = Number(body.campaignId);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!Number.isInteger(campaignId) || !name) {
      return NextResponse.json(
        { error: 'campaignId and name required' },
        { status: 400 },
      );
    }

    const campaign = db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .get();
    if (!campaign) return notFound('Campaign not found');
    if (campaign.isHidden && user.role !== 'admin') {
      return notFound('Campaign not found');
    }

    db.insert(characters)
      .values({
        userId: user.id,
        campaignId,
        name,
        info: typeof body.info === 'string' ? body.info : '',
      })
      .run();
    return NextResponse.json(
      { message: 'Character created. Waiting for admin approval.' },
      { status: 201 },
    );
  });
}

export async function PUT(request: Request) {
  return withGuard(requireAdmin, async () => {
    const body = await request.json();
    db.update(characters)
      .set({ isApproved: body.isApproved })
      .where(eq(characters.id, body.id))
      .run();
    return NextResponse.json({ message: 'Character updated' });
  });
}

export async function DELETE(request: Request) {
  return withGuard(requireAdmin, async () => {
    const { id } = await request.json();
    db.delete(characters).where(eq(characters.id, id)).run();
    return NextResponse.json({ message: 'Character deleted' });
  });
}
