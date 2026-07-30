import bcrypt from 'bcryptjs'
import { db } from './db/index'
import { sessions, users } from './db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

const SALT_ROUNDS = 10
const SESSION_COOKIE = 'session_id'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getExpiresAt(): string {
  return new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString()
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId()
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt: getExpiresAt(),
  })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  })
  return sessionId
}

export async function getSession(): Promise<{ user: typeof users.$inferSelect } | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
  if (!session || new Date(session.expiresAt) < new Date()) {
    if (session) db.delete(sessions).where(eq(sessions.id, sessionId)).run()
    return null
  }

  const user = db.select().from(users).where(eq(users.id, session.userId)).get()
  if (!user) return null

  return { user }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (sessionId) {
    db.delete(sessions).where(eq(sessions.id, sessionId)).run()
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function requireAuth(): Promise<{ user: typeof users.$inferSelect }> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function requireAdmin(): Promise<typeof users.$inferSelect> {
  const session = await requireAuth()
  if (session.user.role !== 'admin') throw new Error('Forbidden')
  return session.user
}
