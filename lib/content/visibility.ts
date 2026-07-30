import { db as defaultDb } from '@/lib/db';
import { pageVisibility, sectionVisibility } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export function getPageVisibility(
  campaignId: number,
  pagePath: string,
  db: any = defaultDb,
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
  db: any = defaultDb,
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
  db: any = defaultDb,
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
  return rows.map((r: any) => r.sectionId);
}
