import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth';
import { badRequest, withGuard } from '@/lib/api/responses';
import { eq } from 'drizzle-orm';

export async function GET() {
  const all = db.select().from(campaigns).all();
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  return withGuard(requireAdmin, () => {
    db.insert(campaigns)
      .values({
        name: body.name,
        description: body.description || '',
        loreRepoUrl: body.loreRepoUrl,
        theme: body.theme || 'sci-fi',
        isHidden: body.isHidden || false,
        starMapConfig: body.starMapConfig || '{}',
      })
      .run();
    return NextResponse.json({ message: 'Campaign created' }, { status: 201 });
  });
}

export async function PUT(request: Request) {
  return withGuard(requireAdmin, async () => {
    const body = await request.json();
    db.update(campaigns)
      .set({
        name: body.name,
        description: body.description,
        loreRepoUrl: body.loreRepoUrl,
        theme: body.theme,
        isHidden: body.isHidden,
        starMapConfig: body.starMapConfig,
      })
      .where(eq(campaigns.id, body.id))
      .run();
    return NextResponse.json({ message: 'Campaign updated' });
  });
}

export async function DELETE(request: Request) {
  return withGuard(requireAdmin, async () => {
    const { id } = await request.json();
    db.delete(campaigns).where(eq(campaigns.id, id)).run();
    return NextResponse.json({ message: 'Campaign deleted' });
  });
}
