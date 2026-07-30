import { db } from '@/lib/db';
import { pageVisibility, sectionVisibility } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export function getPageVisibility(
  campaignId: number,
  pagePath: string,
): boolean {
  const row = db
    .select()
    .from(pageVisibility)
    .where(
      and(
        eq(pageVisibility.campaignId, campaignId),
        eq(pageVisibility.pagePath, pagePath),
      ),
    )
    .get();
  return row ? !row.isHidden : false;
}

export function getSectionVisibility(
  campaignId: number,
  pagePath: string,
  sectionId: string,
): boolean {
  const row = db
    .select()
    .from(sectionVisibility)
    .where(
      and(
        eq(sectionVisibility.campaignId, campaignId),
        eq(sectionVisibility.pagePath, pagePath),
        eq(sectionVisibility.sectionId, sectionId),
      ),
    )
    .get();
  return row ? !row.isHidden : false;
}

export function getHiddenSectionIds(
  campaignId: number,
  pagePath: string,
): string[] {
  const rows = db
    .select()
    .from(sectionVisibility)
    .where(
      and(
        eq(sectionVisibility.campaignId, campaignId),
        eq(sectionVisibility.pagePath, pagePath),
        eq(sectionVisibility.isHidden, true),
      ),
    )
    .all();
  return rows.map((r) => r.sectionId);
}
