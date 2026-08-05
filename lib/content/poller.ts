import { mkdir, readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import {
  campaigns,
  contentCache,
  sessionNotes,
  pageVisibility,
  sectionVisibility,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { byCampaignPage } from '@/lib/db/filters';
import { parseMarkdownFile, parseSessionNoteFile } from './parser';
import { isAllowedRepoUrl } from './repo-url';
import simpleGit from 'simple-git';

const CONTENT_DIR = process.env.CONTENT_DIR || '/data/repos';

export async function pollCampaign(
  campaign: typeof campaigns.$inferSelect,
): Promise<void> {
  const repoDir = path.join(CONTENT_DIR, String(campaign.id));

  if (!existsSync(repoDir)) {
    if (!isAllowedRepoUrl(campaign.loreRepoUrl)) {
      throw new Error(`Refusing to clone unsupported repo URL`);
    }
    await simpleGit().clone(campaign.loreRepoUrl, repoDir, ['--depth', '1']);
  } else {
    const git = simpleGit(repoDir);
    await git.pull('origin', 'HEAD', { '--rebase': null } as never);
  }

  const contentDir = path.join(repoDir, 'content');
  if (existsSync(contentDir)) {
    await parseContentDir(contentDir, campaign.id);
  }

  const sessionNotesDir = path.join(repoDir, 'session-notes');
  if (existsSync(sessionNotesDir)) {
    await parseSessionNotesDir(sessionNotesDir, campaign.id);
  }

  const planetDataDir = path.join(repoDir, 'planet_data');
  if (existsSync(planetDataDir)) {
    await parsePlanetDataDir(planetDataDir, campaign.id);
  }
}

async function parseContentDir(
  dir: string,
  campaignId: number,
  prefix = 'content/',
) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await parseContentDir(fullPath, campaignId, `${prefix}${entry.name}/`);
    } else if (entry.name.endsWith('.md')) {
      const content = await readFile(fullPath, 'utf-8');
      const parsed = parseMarkdownFile(`${prefix}${entry.name}`, content);
      const data = {
        campaignId,
        pagePath: parsed.pagePath,
        markdownRaw: parsed.markdownRaw,
        htmlRendered: parsed.htmlRendered,
        frontmatter: JSON.stringify(parsed.frontmatter),
        planetData: parsed.planetData
          ? JSON.stringify(parsed.planetData)
          : null,
        updatedAt: new Date().toISOString(),
      };
      db.insert(contentCache)
        .values(data)
        .onConflictDoUpdate({
          target: [contentCache.campaignId, contentCache.pagePath],
          set: data,
        })
        .run();

      const existingVis = db
        .select()
        .from(pageVisibility)
        .where(byCampaignPage(pageVisibility, campaignId, parsed.pagePath))
        .get();
      if (!existingVis) {
        db.insert(pageVisibility)
          .values({ campaignId, pagePath: parsed.pagePath, isHidden: true })
          .run();
      }

      for (const sectionId of parsed.sectionIds) {
        const existingSec = db
          .select()
          .from(sectionVisibility)
          .where(
            and(
              byCampaignPage(sectionVisibility, campaignId, parsed.pagePath),
              eq(sectionVisibility.sectionId, sectionId),
            ),
          )
          .get();
        if (!existingSec) {
          db.insert(sectionVisibility)
            .values({
              campaignId,
              pagePath: parsed.pagePath,
              sectionId,
              isHidden: true,
            })
            .run();
        }
      }
    }
  }
}

async function parseSessionNotesDir(dir: string, campaignId: number) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = await readFile(path.join(dir, entry.name), 'utf-8');
      const parsed = parseSessionNoteFile(content);
      const slug = parsed.slug || entry.name.replace(/\.md$/, '');

      const data = {
        campaignId,
        slug,
        title: parsed.title,
        contentMd: parsed.contentMd,
        source: 'git' as const,
        isDmOnly: parsed.isDmOnly,
        updatedAt: new Date().toISOString(),
      };
      db.insert(sessionNotes)
        .values(data)
        .onConflictDoUpdate({
          target: [sessionNotes.campaignId, sessionNotes.slug],
          set: data,
        })
        .run();
    }
  }
}

async function parsePlanetDataDir(dir: string, campaignId: number) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const markersPath = path.join(dir, entry.name, 'markers.json');
      if (existsSync(markersPath)) {
        const markersContent = await readFile(markersPath, 'utf-8');
        const markers = JSON.parse(markersContent);
        const pagePath = `planets/${entry.name}`;
        const existing = db
          .select()
          .from(contentCache)
          .where(byCampaignPage(contentCache, campaignId, pagePath))
          .get();
        if (existing) {
          const pd = existing.planetData ? JSON.parse(existing.planetData) : {};
          db.update(contentCache)
            .set({
              planetData: JSON.stringify({ ...pd, markers }),
              updatedAt: new Date().toISOString(),
            })
            .where(byCampaignPage(contentCache, campaignId, pagePath))
            .run();
        }
      }
    }
  }
}

export async function pollAllCampaigns(): Promise<void> {
  const allCampaigns = db.select().from(campaigns).all();
  await mkdir(CONTENT_DIR, { recursive: true });
  for (const campaign of allCampaigns) {
    try {
      await pollCampaign(campaign);
    } catch (err) {
      console.error(`Failed to poll campaign ${campaign.id}:`, err);
    }
  }
}
