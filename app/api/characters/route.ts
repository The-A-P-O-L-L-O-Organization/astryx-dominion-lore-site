import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters, campaigns } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import {
  errorResponse,
  optionalString,
  parseJsonBody,
  requireNumber,
  requireString,
} from '@/lib/api-errors';

export async function GET() {
  try {
    const all = db.select().from(characters).all();
    return NextResponse.json(all);
  } catch (err) {
    return errorResponse('GET /api/characters', err);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const body = await parseJsonBody(request);
    const campaignId = requireNumber(body, 'campaignId');
    const name = requireString(body, 'name');

    const campaign = db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .get();
    if (!campaign)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 },
      );

    db.insert(characters)
      .values({
        userId: user.id,
        campaignId,
        name,
        info: optionalString(body, 'info'),
      })
      .run();
    return NextResponse.json(
      { message: 'Character created. Waiting for admin approval.' },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse('POST /api/characters', err);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    db.update(characters)
      .set({ isApproved: !!body.isApproved })
      .where(eq(characters.id, requireNumber(body, 'id')))
      .run();
    return NextResponse.json({ message: 'Character updated' });
  } catch (err) {
    return errorResponse('PUT /api/characters', err);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    db.delete(characters)
      .where(eq(characters.id, requireNumber(body, 'id')))
      .run();
    return NextResponse.json({ message: 'Character deleted' });
  } catch (err) {
    return errorResponse('DELETE /api/characters', err);
  }
}
