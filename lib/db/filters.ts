import { eq, and, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

interface CampaignPageTable {
  campaignId: SQLiteColumn;
  pagePath: SQLiteColumn;
}

export function byCampaignPage(
  table: CampaignPageTable,
  campaignId: number,
  pagePath: string,
): SQL | undefined {
  return and(eq(table.campaignId, campaignId), eq(table.pagePath, pagePath));
}
