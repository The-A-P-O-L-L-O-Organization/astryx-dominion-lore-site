import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH || './data/app.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'player',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    lore_repo_url TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT 'sci-fi',
    is_hidden INTEGER NOT NULL DEFAULT 0,
    star_map_config TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    name TEXT NOT NULL,
    info TEXT NOT NULL DEFAULT '',
    is_approved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS page_visibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    page_path TEXT NOT NULL,
    is_hidden INTEGER NOT NULL DEFAULT 1,
    UNIQUE(campaign_id, page_path)
  );

  CREATE TABLE IF NOT EXISTS section_visibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    page_path TEXT NOT NULL,
    section_id TEXT NOT NULL,
    is_hidden INTEGER NOT NULL DEFAULT 1,
    UNIQUE(campaign_id, page_path, section_id)
  );

  CREATE TABLE IF NOT EXISTS content_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    page_path TEXT NOT NULL,
    markdown_raw TEXT NOT NULL,
    html_rendered TEXT NOT NULL,
    frontmatter TEXT NOT NULL DEFAULT '{}',
    planet_data TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(campaign_id, page_path)
  );

  CREATE TABLE IF NOT EXISTS session_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    content_md TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    source TEXT NOT NULL DEFAULT 'in-app',
    is_dm_only INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(campaign_id, slug)
  );
`);

console.log('Database migrated successfully');
sqlite.close();
