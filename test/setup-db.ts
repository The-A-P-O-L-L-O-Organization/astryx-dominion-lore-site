import { describe, it, expect, vi, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@/lib/db/schema'

// Build in-memory DB matching the real schema
function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      setting_theme TEXT,
      star_map_config TEXT NOT NULL DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      campaign_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );
    CREATE TABLE page_visibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      page_path TEXT NOT NULL,
      is_hidden INTEGER NOT NULL DEFAULT 1,
      UNIQUE(campaign_id, page_path)
    );
    CREATE TABLE section_visibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      page_path TEXT NOT NULL,
      section_id TEXT NOT NULL,
      is_hidden INTEGER NOT NULL DEFAULT 1,
      UNIQUE(campaign_id, page_path, section_id)
    );
    CREATE TABLE content_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      page_path TEXT NOT NULL,
      title TEXT,
      markdown_raw TEXT,
      html_rendered TEXT,
      frontmatter TEXT NOT NULL DEFAULT '{}',
      planet_data TEXT,
      section_ids TEXT NOT NULL DEFAULT '[]',
      parent_id INTEGER,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(campaign_id, page_path)
    );
    CREATE TABLE IF NOT EXISTS session_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      slug TEXT NOT NULL,
      title TEXT,
      content_md TEXT NOT NULL DEFAULT '',
      is_dm_only INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(campaign_id, slug)
    );
  `)
  return drizzle(sqlite)
}

// Mock the auth module with a controllable session
function setupAuthMocks(overrides: {
  userId?: number
  role?: string
  isAuthenticated?: boolean
  isAdmin?: boolean
}) {
  const { userId = 1, role = 'player', isAuthenticated = true, isAdmin = false } = overrides
  const user = { id: userId, username: 'testuser', role, passwordHash: '', createdAt: '' }
  const session = isAuthenticated ? { user } : null

  vi.mock('@/lib/auth', () => ({
    hashPassword: vi.fn((p: string) => Promise.resolve(`hashed:${p}`)),
    verifyPassword: vi.fn((p: string, h: string) => Promise.resolve(h === `hashed:${p}`)),
    createSession: vi.fn(() => Promise.resolve('mock-session-id')),
    getSession: vi.fn(() => Promise.resolve(session)),
    destroySession: vi.fn(() => Promise.resolve()),
    requireAuth: vi.fn(() => {
      if (!isAuthenticated) throw new Error('Unauthorized')
      return Promise.resolve(session)
    }),
    requireAdmin: vi.fn(() => {
      if (!isAuthenticated) throw new Error('Unauthorized')
      if (!isAdmin) throw new Error('Forbidden')
      return Promise.resolve(user)
    }),
  }))
}

export function cleanupMocks() {
  vi.restoreAllMocks()
}

export { createTestDb, setupAuthMocks }
