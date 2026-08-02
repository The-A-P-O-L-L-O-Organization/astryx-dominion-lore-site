import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { isAllowedRepoUrl } from '@/lib/content/repo-url';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { user } = await requireAuth();
    if (user.role === 'admin') {
      return NextResponse.json(db.select().from(campaigns).all());
    }
    const visible = db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        theme: campaigns.theme,
        isHidden: campaigns.isHidden,
        createdAt: campaigns.createdAt,
      })
      .from(campaigns)
      .where(eq(campaigns.isHidden, false))
      .all();
    return NextResponse.json(visible);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  try {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const loreRepoUrl =
      typeof body.loreRepoUrl === 'string' ? body.loreRepoUrl.trim() : '';
    if (!name || !isAllowedRepoUrl(loreRepoUrl)) {
      return NextResponse.json(
        { error: 'name and a valid http(s)/ssh loreRepoUrl are required' },
        { status: 400 },
      );
    }
    db.insert(campaigns)
      .values({
        name,
        description:
          typeof body.description === 'string' ? body.description : '',
        loreRepoUrl,
        theme: typeof body.theme === 'string' ? body.theme : 'sci-fi',
        isHidden: !!body.isHidden,
        starMapConfig:
          typeof body.starMapConfig === 'string' ? body.starMapConfig : '{}',
      })
      .run();
    return NextResponse.json({ message: 'Campaign created' }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (
      typeof body.loreRepoUrl === 'string' &&
      !isAllowedRepoUrl(body.loreRepoUrl.trim())
    ) {
      return NextResponse.json(
        { error: 'Invalid loreRepoUrl' },
        { status: 400 },
      );
    }
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
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    db.delete(campaigns).where(eq(campaigns.id, id)).run();
    return NextResponse.json({ message: 'Campaign deleted' });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
