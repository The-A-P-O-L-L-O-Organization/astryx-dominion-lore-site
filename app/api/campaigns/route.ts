import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { requireAdmin, requireAuth } from '@/lib/auth';
import {
  BadRequestError,
  errorResponse,
  parseJsonBody,
  requireNumber,
  requireString,
} from '@/lib/api-errors';
import { isAllowedRepoUrl } from '@/lib/content/repo-url';
import { coerceTheme } from '@/lib/themes';
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
  } catch (err) {
    return errorResponse('GET /api/campaigns', err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const name = requireString(body, 'name').trim();
    const loreRepoUrl = requireString(body, 'loreRepoUrl').trim();
    if (!isAllowedRepoUrl(loreRepoUrl)) {
      throw new BadRequestError(
        'name and a valid http(s)/ssh loreRepoUrl are required',
      );
    }
    db.insert(campaigns)
      .values({
        name,
        description:
          typeof body.description === 'string' ? body.description : '',
        loreRepoUrl,
        theme: coerceTheme(body.theme),
        isHidden: !!body.isHidden,
        starMapConfig:
          typeof body.starMapConfig === 'string' ? body.starMapConfig : '{}',
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
    if (
      (body.name !== undefined &&
        (typeof body.name !== 'string' || !body.name.trim())) ||
      (body.loreRepoUrl !== undefined &&
        (typeof body.loreRepoUrl !== 'string' ||
          !isAllowedRepoUrl(body.loreRepoUrl.trim()))) ||
      (body.starMapConfig !== undefined &&
        typeof body.starMapConfig !== 'string') ||
      (body.isHidden !== undefined && typeof body.isHidden !== 'boolean')
    ) {
      throw new BadRequestError('Invalid campaign fields');
    }
    const theme = body.theme == null ? undefined : coerceTheme(body.theme);
    db.update(campaigns)
      .set({
        name:
          typeof body.name === 'string' && body.name.trim()
            ? body.name.trim()
            : undefined,
        description:
          typeof body.description === 'string' ? body.description : undefined,
        loreRepoUrl:
          typeof body.loreRepoUrl === 'string' && body.loreRepoUrl.trim()
            ? body.loreRepoUrl.trim()
            : undefined,
        theme,
        isHidden:
          typeof body.isHidden === 'boolean' ? body.isHidden : undefined,
        starMapConfig:
          typeof body.starMapConfig === 'string'
            ? body.starMapConfig
            : undefined,
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
