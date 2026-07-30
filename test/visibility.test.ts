import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { pageVisibility, sectionVisibility } from '@/lib/db/schema';
import {
  getPageVisibility,
  getSectionVisibility,
  getHiddenSectionIds,
} from '@/lib/content/visibility';

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS page_visibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      page_path TEXT NOT NULL,
      is_hidden INTEGER NOT NULL DEFAULT 1,
      UNIQUE(campaign_id, page_path)
    );
    CREATE TABLE IF NOT EXISTS section_visibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      page_path TEXT NOT NULL,
      section_id TEXT NOT NULL,
      is_hidden INTEGER NOT NULL DEFAULT 1,
      UNIQUE(campaign_id, page_path, section_id)
    );
  `);
  return drizzle(sqlite);
}

describe('getPageVisibility', () => {
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('returns false when no visibility row exists', () => {
    const result = getPageVisibility(1, 'factions', db);
    expect(result).toBe(false);
  });

  it('returns true when page is not hidden', () => {
    db.insert(pageVisibility)
      .values({ campaignId: 1, pagePath: 'factions', isHidden: false })
      .run();
    const result = getPageVisibility(1, 'factions', db);
    expect(result).toBe(true);
  });

  it('returns false when page is hidden', () => {
    db.insert(pageVisibility)
      .values({ campaignId: 1, pagePath: 'factions', isHidden: true })
      .run();
    const result = getPageVisibility(1, 'factions', db);
    expect(result).toBe(false);
  });

  it('handles different campaigns independently', () => {
    db.insert(pageVisibility)
      .values({ campaignId: 1, pagePath: 'factions', isHidden: false })
      .run();
    db.insert(pageVisibility)
      .values({ campaignId: 2, pagePath: 'factions', isHidden: true })
      .run();
    expect(getPageVisibility(1, 'factions', db)).toBe(true);
    expect(getPageVisibility(2, 'factions', db)).toBe(false);
  });
});

describe('getSectionVisibility', () => {
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('returns false when no visibility row exists', () => {
    const result = getSectionVisibility(1, 'factions', 'history', db);
    expect(result).toBe(false);
  });

  it('returns true when section is not hidden', () => {
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'history',
        isHidden: false,
      })
      .run();
    const result = getSectionVisibility(1, 'factions', 'history', db);
    expect(result).toBe(true);
  });

  it('returns false when section is hidden', () => {
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'history',
        isHidden: true,
      })
      .run();
    const result = getSectionVisibility(1, 'factions', 'history', db);
    expect(result).toBe(false);
  });

  it('distinguishes sections within the same page', () => {
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'history',
        isHidden: false,
      })
      .run();
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'leadership',
        isHidden: true,
      })
      .run();
    expect(getSectionVisibility(1, 'factions', 'history', db)).toBe(true);
    expect(getSectionVisibility(1, 'factions', 'leadership', db)).toBe(false);
  });
});

describe('getHiddenSectionIds', () => {
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('returns empty array when no sections are hidden', () => {
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'history',
        isHidden: false,
      })
      .run();
    const result = getHiddenSectionIds(1, 'factions', db);
    expect(result).toEqual([]);
  });

  it('returns only hidden section IDs', () => {
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'history',
        isHidden: false,
      })
      .run();
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'secrets',
        isHidden: true,
      })
      .run();
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'leadership',
        isHidden: true,
      })
      .run();
    const result = getHiddenSectionIds(1, 'factions', db);
    expect(result).toEqual(expect.arrayContaining(['secrets', 'leadership']));
  });

  it('does not return hidden sections from other pages', () => {
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'factions',
        sectionId: 'secrets',
        isHidden: true,
      })
      .run();
    db.insert(sectionVisibility)
      .values({
        campaignId: 1,
        pagePath: 'planets',
        sectionId: 'secrets',
        isHidden: true,
      })
      .run();
    const result = getHiddenSectionIds(1, 'factions', db);
    expect(result).toEqual(['secrets']);
  });
});
