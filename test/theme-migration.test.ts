import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { themeMigrationSql } from '@/lib/db/theme-migration';

const campaignsDdl = `
  CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    lore_repo_url TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT 'techno',
    is_hidden INTEGER NOT NULL DEFAULT 0,
    star_map_config TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

function seedCampaigns(sqlite: Database.Database) {
  sqlite.exec(`
    INSERT INTO campaigns (name, lore_repo_url, theme) VALUES
      ('a', 'x', 'sci-fi'),
      ('b', 'y', 'fantasy'),
      ('c', 'z', 'techno');
  `);
}

function selectThemes(sqlite: Database.Database) {
  return (
    sqlite.prepare('SELECT theme FROM campaigns ORDER BY id').all() as {
      theme: string;
    }[]
  ).map((row) => row.theme);
}

describe('themeMigrationSql', () => {
  it('renames legacy themes and leaves fresh values untouched', () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(campaignsDdl);
    seedCampaigns(sqlite);

    sqlite.exec(themeMigrationSql);

    expect(selectThemes(sqlite)).toEqual(['techno', 'ember', 'techno']);
  });

  it('is idempotent', () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(campaignsDdl);
    seedCampaigns(sqlite);

    sqlite.exec(themeMigrationSql);
    sqlite.exec(themeMigrationSql);

    expect(selectThemes(sqlite)).toEqual(['techno', 'ember', 'techno']);
  });

  it('rolls back both statements when the second fails', () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      ${campaignsDdl}
      CREATE TRIGGER reject_ember BEFORE UPDATE OF theme ON campaigns
      WHEN NEW.theme = 'ember'
      BEGIN
        SELECT RAISE(ROLLBACK, 'ember not allowed');
      END;
    `);
    seedCampaigns(sqlite);

    expect(() => sqlite.exec(themeMigrationSql)).toThrow();

    expect(selectThemes(sqlite)).toEqual(['sci-fi', 'fantasy', 'techno']);
  });
});
