import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/characters/route'

vi.mock('@/lib/db', async () => {
  const { default: Database } = await vi.importActual<typeof import('better-sqlite3')>('better-sqlite3')
  const { drizzle } = await vi.importActual<typeof import('drizzle-orm/better-sqlite3')>('drizzle-orm/better-sqlite3')
  const schemaMod = await vi.importActual<typeof import('@/lib/db/schema')>('@/lib/db/schema')
  const sqlite = new Database(':memory:')
  sqlite.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'player', created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE campaigns (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', lore_repo_url TEXT NOT NULL DEFAULT '', theme TEXT NOT NULL DEFAULT 'sci-fi', is_hidden INTEGER NOT NULL DEFAULT 0, star_map_config TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE characters (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, campaign_id INTEGER NOT NULL, name TEXT NOT NULL, info TEXT NOT NULL DEFAULT '', is_approved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  `)
  return { db: drizzle(sqlite, { schema: schemaMod }) }
})

const mockUser = { id: 1, username: 'player1', role: 'player' as const }
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ user: mockUser })),
  requireAdmin: vi.fn(() => Promise.resolve({ ...mockUser, role: 'admin' })),
}))

import * as schema from '@/lib/db/schema'
import { db } from '@/lib/db'

describe('GET /api/characters', () => {
  beforeEach(() => {
    db.delete(schema.characters).run()
    db.delete(schema.campaigns).run()
    db.delete(schema.users).run()
    vi.clearAllMocks()
  })

  it('returns empty array', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body).toEqual([])
  })

  it('returns all characters', async () => {
    db.insert(schema.users).values({ username: 'u', passwordHash: 'hash' }).run()
    db.insert(schema.campaigns).values({ name: 'C', loreRepoUrl: 'x' }).run()
    db.insert(schema.characters).values({ userId: 1, campaignId: 1, name: 'Hero' }).run()
    const res = await GET()
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Hero')
  })
})

describe('POST /api/characters', () => {
  beforeEach(() => {
    db.delete(schema.characters).run()
    db.delete(schema.campaigns).run()
    db.delete(schema.users).run()
    vi.clearAllMocks()
  })

  it('creates a character for authenticated user', async () => {
    db.insert(schema.campaigns).values({ name: 'C1', loreRepoUrl: 'x' }).run()
    const req = new Request('http://localhost/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: 1, name: 'My Character' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('rejects nonexistent campaign', async () => {
    const req = new Request('http://localhost/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: 999, name: 'Ghost' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})
