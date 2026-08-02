import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters, campaigns } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { notFound, withGuard } from '@/lib/api/responses';
import { eq } from 'drizzle-orm';

export async function GET() {
  const all = db.select().from(characters).all();
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  return withGuard(requireAuth, async ({ user }) => {
    const body = await request.json();

    const campaign = db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, body.campaignId))
      .get();
    if (!campaign) return notFound('Campaign not found');

    db.insert(characters)
      .values({
        userId: user.id,
        campaignId: body.campaignId,
        name: body.name,
        info: body.info || '',
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
