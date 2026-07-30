import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as loginHandler } from '@/app/api/auth/login/route'

const db = vi.hoisted(() => {
  const Database = require('better-sqlite3')
  const { drizzle } = require('drizzle-orm/better-sqlite3')
  const sqlite = new Database(':memory:')
  sqlite.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'player', created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id));
  `)
  return drizzle(sqlite)
})

const mockCreateSession = vi.hoisted(() => vi.fn(() => Promise.resolve('mock-session-id')))

vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/lib/auth', () => ({
  verifyPassword: vi.fn((password: string) => Promise.resolve(password === 'correct-password')),
  createSession: mockCreateSession,
}))

import * as schema from '@/lib/db/schema'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    db.delete(schema.users).run()
    db.delete(schema.sessions).run()
    vi.clearAllMocks()
  })

  it('returns 200 for valid credentials', async () => {
    db.insert(schema.users).values({ username: 'alice', passwordHash: 'irrelevant-hash', role: 'player' }).run()
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'correct-password' }),
    })
    const res = await loginHandler(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.username).toBe('alice')
    expect(body.role).toBe('player')
    expect(mockCreateSession).toHaveBeenCalledWith(1)
  })

  it('returns 401 for wrong password', async () => {
    db.insert(schema.users).values({ username: 'alice', passwordHash: 'irrelevant', role: 'player' }).run()
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'wrong-password' }),
    })
    const res = await loginHandler(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 for nonexistent user', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nobody', password: 'anything' }),
    })
    const res = await loginHandler(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing fields', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await loginHandler(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty username', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: 'test' }),
    })
    const res = await loginHandler(req)
    expect(res.status).toBe(400)
  })
})
