import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageVisibility, sectionVisibility } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth';
import { badRequest, withGuard } from '@/lib/api/responses';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  return withGuard(requireAdmin, () => {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) return badRequest('campaignId required');

    const pages = db
      .select()
      .from(pageVisibility)
      .where(eq(pageVisibility.campaignId, Number(campaignId)))
      .all();

    const sections = db
      .select()
      .from(sectionVisibility)
      .where(eq(sectionVisibility.campaignId, Number(campaignId)))
      .all();

    return NextResponse.json({ pages, sections });
  });
}

export async function PUT(request: Request) {
  return withGuard(requireAdmin, async () => {
    const body = await request.json();

    if (body.type === 'page') {
      db.update(pageVisibility)
        .set({ isHidden: body.isHidden })
        .where(
          and(
            eq(pageVisibility.campaignId, body.campaignId),
            eq(pageVisibility.pagePath, body.pagePath),
          ),
        )
        .run();
    } else if (body.type === 'section') {
      db.update(sectionVisibility)
        .set({ isHidden: body.isHidden })
        .where(
          and(
            eq(sectionVisibility.campaignId, body.campaignId),
            eq(sectionVisibility.pagePath, body.pagePath),
            eq(sectionVisibility.sectionId, body.sectionId),
          ),
        )
        .run();
    }

    return NextResponse.json({ message: 'Updated' });
  });
}
