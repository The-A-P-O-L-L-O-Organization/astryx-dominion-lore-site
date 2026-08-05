import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contentCache } from '@/lib/db/schema';

export interface LoreIndexItem {
  path: string;
  title: string;
  category?: string;
}

export function getLoreIndex(campaignId: number): LoreIndexItem[] {
  return db
    .select({
      pagePath: contentCache.pagePath,
      frontmatter: contentCache.frontmatter,
    })
    .from(contentCache)
    .where(eq(contentCache.campaignId, campaignId))
    .all()
    .map((page) => {
      const frontmatter = JSON.parse(page.frontmatter);
      const parts = page.pagePath.split('/');
      return {
        path: page.pagePath,
        title: (frontmatter.title as string) || parts[parts.length - 1],
        category: parts.length > 1 ? parts[0] : undefined,
      };
    });
}
