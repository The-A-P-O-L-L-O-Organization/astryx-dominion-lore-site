import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth';
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
    const all = db.select().from(campaigns).all();
    return NextResponse.json(all);
  } catch (err) {
    return errorResponse('GET /api/campaigns', err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    db.insert(campaigns)
      .values({
        name: requireString(body, 'name'),
        description: optionalString(body, 'description'),
        loreRepoUrl: requireString(body, 'loreRepoUrl'),
        theme: optionalString(body, 'theme', 'sci-fi'),
        isHidden: !!body.isHidden,
        starMapConfig: optionalString(body, 'starMapConfig', '{}'),
      })
      .run();
    return NextResponse.json({ message: 'Campaign created' }, { status: 201 });
  } catch (err) {
    return errorResponse('POST /api/campaigns', err);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const id = requireNumber(body, 'id');
    db.update(campaigns)
      .set({
        name: requireString(body, 'name'),
        description: optionalString(body, 'description'),
        loreRepoUrl: requireString(body, 'loreRepoUrl'),
        theme: optionalString(body, 'theme', 'sci-fi'),
        isHidden: !!body.isHidden,
        starMapConfig: optionalString(body, 'starMapConfig', '{}'),
      })
      .where(eq(campaigns.id, id))
      .run();
    return NextResponse.json({ message: 'Campaign updated' });
  } catch (err) {
    return errorResponse('PUT /api/campaigns', err);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    db.delete(campaigns)
      .where(eq(campaigns.id, requireNumber(body, 'id')))
      .run();
    return NextResponse.json({ message: 'Campaign deleted' });
  } catch (err) {
    return errorResponse('DELETE /api/campaigns', err);
  }
}
