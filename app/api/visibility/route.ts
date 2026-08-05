import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageVisibility, sectionVisibility } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import {
  BadRequestError,
  errorResponse,
  parseJsonBody,
  requireNumber,
  requireString,
} from '@/lib/api-errors';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) throw new BadRequestError('campaignId required');

    const campaignIdNum = Number(campaignId);
    if (!Number.isFinite(campaignIdNum))
      throw new BadRequestError('Invalid campaign ID');

    const pages = db
      .select()
      .from(pageVisibility)
      .where(eq(pageVisibility.campaignId, campaignIdNum))
      .all();

    const sections = db
      .select()
      .from(sectionVisibility)
      .where(eq(sectionVisibility.campaignId, campaignIdNum))
      .all();

    return NextResponse.json({ pages, sections });
  } catch (err) {
    return errorResponse('GET /api/visibility', err);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const type = requireString(body, 'type');
    const campaignId = requireNumber(body, 'campaignId');
    const pagePath = requireString(body, 'pagePath');
    const isHidden = !!body.isHidden;

    if (type === 'page') {
      db.update(pageVisibility)
        .set({ isHidden })
        .where(
          and(
            eq(pageVisibility.campaignId, campaignId),
            eq(pageVisibility.pagePath, pagePath),
          ),
        )
        .run();
    } else if (type === 'section') {
      db.update(sectionVisibility)
        .set({ isHidden })
        .where(
          and(
            eq(sectionVisibility.campaignId, campaignId),
            eq(sectionVisibility.pagePath, pagePath),
            eq(sectionVisibility.sectionId, requireString(body, 'sectionId')),
          ),
        )
        .run();
    } else {
      throw new BadRequestError("type must be 'page' or 'section'");
    }

    return NextResponse.json({ message: 'Updated' });
  } catch (err) {
    return errorResponse('PUT /api/visibility', err);
  }
}
