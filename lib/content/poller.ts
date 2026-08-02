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
import { parseMarkdownFile, parseSessionNoteFile } from './parser';
import simpleGit from 'simple-git';
import { parseJsonOrThrow } from '@/lib/json';

const CONTENT_DIR = process.env.CONTENT_DIR || '/data/repos';

export async function pollCampaign(
  campaign: typeof campaigns.$inferSelect,
): Promise<void> {
  const repoDir = `${CONTENT_DIR}/${campaign.id}`;

  if (!existsSync(repoDir)) {
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
      let parsed;
      try {
        parsed = parseMarkdownFile(`${prefix}${entry.name}`, content);
      } catch (err) {
        throw new Error(`Failed to parse markdown file ${fullPath}`, {
          cause: err,
        });
      }
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
        .where(
          and(
            eq(pageVisibility.campaignId, campaignId),
            eq(pageVisibility.pagePath, parsed.pagePath),
          ),
        )
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
              eq(sectionVisibility.campaignId, campaignId),
              eq(sectionVisibility.pagePath, parsed.pagePath),
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
      const notePath = path.join(dir, entry.name);
      const content = await readFile(notePath, 'utf-8');
      let parsed;
      try {
        parsed = parseSessionNoteFile(content);
      } catch (err) {
        throw new Error(`Failed to parse session note ${notePath}`, {
          cause: err,
        });
      }
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
        const markers = parseJsonOrThrow(markersContent, markersPath);
        const pagePath = `planets/${entry.name}`;
        const existing = db
          .select()
          .from(contentCache)
          .where(
            and(
              eq(contentCache.campaignId, campaignId),
              eq(contentCache.pagePath, pagePath),
            ),
          )
          .get();
        if (existing) {
          const pd = existing.planetData
            ? parseJsonOrThrow(
                existing.planetData,
                `planet_data for ${pagePath}`,
              )
            : {};
          db.update(contentCache)
            .set({
              planetData: JSON.stringify({ ...pd, markers }),
              updatedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(contentCache.campaignId, campaignId),
                eq(contentCache.pagePath, pagePath),
              ),
            )
            .run();
        }
      }
    }
  }
}

export interface PollFailure {
  campaignId: number;
  campaignName: string;
  error: string;
}

export interface PollResult {
  polled: number;
  failures: PollFailure[];
}

export async function pollAllCampaigns(): Promise<PollResult> {
  const allCampaigns = db.select().from(campaigns).all();
  await mkdir(CONTENT_DIR, { recursive: true });
  const failures: PollFailure[] = [];
  for (const campaign of allCampaigns) {
    try {
      await pollCampaign(campaign);
    } catch (err) {
      console.error(`Failed to poll campaign ${campaign.id}:`, err);
      failures.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { polled: allCampaigns.length - failures.length, failures };
}
