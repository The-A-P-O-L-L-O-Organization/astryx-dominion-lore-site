import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

// CONTENT_DIR is read when the poller module is first imported, so it must be
// set before any import of it is evaluated.
const contentRoot = vi.hoisted(() => {
  const dir = `${process.env.TMPDIR || '/tmp'}/poller-content-${process.pid}-${Date.now()}`;
  process.env.CONTENT_DIR = dir;
  return dir;
});

vi.mock('@/lib/db', async () => {
  const { default: Database } =
    await vi.importActual<typeof import('better-sqlite3')>('better-sqlite3');
  const { drizzle } = await vi.importActual<
    typeof import('drizzle-orm/better-sqlite3')
  >('drizzle-orm/better-sqlite3');
  const schemaMod =
    await vi.importActual<typeof import('@/lib/db/schema')>('@/lib/db/schema');
  const ddlMod = await vi.importActual<typeof import('@/lib/db/schema-ddl')>(
    '@/lib/db/schema-ddl',
  );
  const sqlite = new Database(':memory:');
  sqlite.exec(ddlMod.schemaDdl);
  return { db: drizzle(sqlite, { schema: schemaMod }) };
});

const clone = vi.fn(() => Promise.resolve());
const pull = vi.fn(() => Promise.resolve());
vi.mock('simple-git', () => ({
  default: vi.fn(() => ({ clone, pull })),
}));

import simpleGit from 'simple-git';
import { db } from '@/lib/db';
import {
  campaigns,
  contentCache,
  pageVisibility,
  sectionVisibility,
  sessionNotes,
} from '@/lib/db/schema';
import { pollCampaign, pollAllCampaigns } from '@/lib/content/poller';

const campaign = {
  id: 1,
  name: 'Astryx',
  description: '',
  loreRepoUrl: 'https://example.com/lore.git',
  theme: 'sci-fi',
  isHidden: false,
  starMapConfig: '{}',
  createdAt: '',
};

function repoDir(id: number) {
  return path.join(contentRoot, String(id));
}

function seedRepo(
  id: number,
  files: { dir: string; name: string; body: string }[],
) {
  for (const file of files) {
    const dir = path.join(repoDir(id), file.dir);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, file.name), file.body);
  }
}

describe('pollCampaign', () => {
  beforeEach(() => {
    db.delete(contentCache).run();
    db.delete(pageVisibility).run();
    db.delete(sectionVisibility).run();
    db.delete(sessionNotes).run();
    db.delete(campaigns).run();
    db.insert(campaigns)
      .values({
        id: campaign.id,
        name: campaign.name,
        loreRepoUrl: campaign.loreRepoUrl,
      })
      .run();
    vi.clearAllMocks();
  });

  afterEach(() => {
    rmSync(repoDir(campaign.id), { recursive: true, force: true });
  });

  it('clones the repo when it is not yet on disk', async () => {
    await pollCampaign(campaign);
    expect(clone).toHaveBeenCalledWith(campaign.loreRepoUrl, repoDir(1), [
      '--depth',
      '1',
    ]);
    expect(pull).not.toHaveBeenCalled();
  });

  it('pulls instead of cloning when the repo already exists', async () => {
    seedRepo(1, [{ dir: '.', name: 'README.md', body: '# hi' }]);
    await pollCampaign(campaign);
    expect(clone).not.toHaveBeenCalled();
    expect(simpleGit).toHaveBeenCalledWith(repoDir(1));
    expect(pull).toHaveBeenCalled();
  });

  it('caches markdown content and defaults page visibility to hidden', async () => {
    seedRepo(1, [
      {
        dir: 'content',
        name: 'factions.md',
        body: '---\ntitle: Factions\n---\n\n## History\n\nText',
      },
    ]);
    await pollCampaign(campaign);

    const cached = db.select().from(contentCache).all();
    expect(cached).toHaveLength(1);
    expect(cached[0].pagePath).toBe('factions');
    expect(cached[0].markdownRaw).toContain('## History');
    expect(JSON.parse(cached[0].frontmatter).title).toBe('Factions');

    const pages = db.select().from(pageVisibility).all();
    expect(pages).toEqual([
      expect.objectContaining({ pagePath: 'factions', isHidden: true }),
    ]);
    const sections = db.select().from(sectionVisibility).all();
    expect(sections.map((s) => s.sectionId)).toContain('history');
    expect(sections.every((s) => s.isHidden)).toBe(true);
  });

  it('recurses into nested content directories', async () => {
    seedRepo(1, [
      {
        dir: path.join('content', 'planets'),
        name: 'terra.md',
        body: '---\ntitle: Terra\n---\n\nBody',
      },
    ]);
    await pollCampaign(campaign);
    const cached = db.select().from(contentCache).all();
    expect(cached.map((c) => c.pagePath)).toEqual(['planets/terra']);
  });

  it('ignores non-markdown files', async () => {
    seedRepo(1, [
      { dir: 'content', name: 'notes.txt', body: 'plain text' },
      { dir: 'content', name: 'ok.md', body: '# Ok' },
    ]);
    await pollCampaign(campaign);
    const cached = db.select().from(contentCache).all();
    expect(cached).toHaveLength(1);
    expect(cached[0].pagePath).toBe('ok');
  });

  it('updates cached content and preserves existing visibility on re-poll', async () => {
    seedRepo(1, [
      { dir: 'content', name: 'factions.md', body: '# One\n\n## History' },
    ]);
    await pollCampaign(campaign);
    db.update(pageVisibility).set({ isHidden: false }).run();
    db.update(sectionVisibility).set({ isHidden: false }).run();

    seedRepo(1, [
      { dir: 'content', name: 'factions.md', body: '# Two\n\n## History' },
    ]);
    await pollCampaign(campaign);

    const cached = db.select().from(contentCache).all();
    expect(cached).toHaveLength(1);
    expect(cached[0].markdownRaw).toContain('# Two');
    expect(db.select().from(pageVisibility).all()).toHaveLength(1);
    expect(
      db
        .select()
        .from(pageVisibility)
        .all()
        .every((p) => p.isHidden),
    ).toBe(false);
    expect(
      db
        .select()
        .from(sectionVisibility)
        .all()
        .every((s) => s.isHidden),
    ).toBe(false);
  });

  it('imports session notes from the session-notes directory', async () => {
    seedRepo(1, [
      {
        dir: 'session-notes',
        name: 'session-001.md',
        body: '---\ntitle: First Session\nis_dm_only: true\n---\n\nWhat happened',
      },
    ]);
    await pollCampaign(campaign);
    const notes = db.select().from(sessionNotes).all();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      slug: 'session-001',
      title: 'First Session',
      isDmOnly: true,
      source: 'git',
    });
    expect(notes[0].contentMd).toContain('What happened');
  });

  it('upserts session notes on repeated polls', async () => {
    seedRepo(1, [
      {
        dir: 'session-notes',
        name: 'session-001.md',
        body: '---\ntitle: First\n---\n\nv1',
      },
    ]);
    await pollCampaign(campaign);
    seedRepo(1, [
      {
        dir: 'session-notes',
        name: 'session-001.md',
        body: '---\ntitle: First (revised)\n---\n\nv2',
      },
    ]);
    await pollCampaign(campaign);

    const notes = db.select().from(sessionNotes).all();
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe('First (revised)');
    expect(notes[0].contentMd).toContain('v2');
  });

  it('merges planet markers into cached planet pages', async () => {
    seedRepo(1, [
      {
        dir: path.join('content', 'planets'),
        name: 'terra.md',
        body: '---\ntitle: Terra\n---\n\nBody',
      },
      {
        dir: path.join('planet_data', 'terra'),
        name: 'markers.json',
        body: JSON.stringify([{ id: 'capital', lat: 1, lng: 2 }]),
      },
    ]);
    await pollCampaign(campaign);

    const page = db
      .select()
      .from(contentCache)
      .all()
      .find((c) => c.pagePath === 'planets/terra');
    expect(page).toBeDefined();
    expect(JSON.parse(page!.planetData ?? 'null')).toMatchObject({
      markers: [{ id: 'capital', lat: 1, lng: 2 }],
    });
  });

  it('skips planet markers when there is no matching cached page', async () => {
    seedRepo(1, [
      {
        dir: path.join('planet_data', 'terra'),
        name: 'markers.json',
        body: JSON.stringify([{ id: 'capital' }]),
      },
    ]);
    await expect(pollCampaign(campaign)).resolves.toBeUndefined();
    expect(db.select().from(contentCache).all()).toHaveLength(0);
  });
});

describe('pollAllCampaigns', () => {
  beforeEach(() => {
    db.delete(contentCache).run();
    db.delete(pageVisibility).run();
    db.delete(sectionVisibility).run();
    db.delete(sessionNotes).run();
    db.delete(campaigns).run();
    vi.clearAllMocks();
  });

  afterEach(() => {
    rmSync(repoDir(1), { recursive: true, force: true });
    rmSync(repoDir(2), { recursive: true, force: true });
  });

  it('does nothing when there are no campaigns', async () => {
    await pollAllCampaigns();
    expect(clone).not.toHaveBeenCalled();
  });

  it('polls every campaign', async () => {
    db.insert(campaigns)
      .values([
        { id: 1, name: 'A', loreRepoUrl: 'https://example.com/a.git' },
        { id: 2, name: 'B', loreRepoUrl: 'https://example.com/b.git' },
      ])
      .run();
    await pollAllCampaigns();
    expect(clone).toHaveBeenCalledTimes(2);
  });

  it('continues polling after one campaign fails', async () => {
    db.insert(campaigns)
      .values([
        { id: 1, name: 'A', loreRepoUrl: 'https://example.com/a.git' },
        { id: 2, name: 'B', loreRepoUrl: 'https://example.com/b.git' },
      ])
      .run();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    clone.mockRejectedValueOnce(new Error('clone failed'));

    await expect(pollAllCampaigns()).resolves.toBeUndefined();
    expect(clone).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledOnce();
  });
});
