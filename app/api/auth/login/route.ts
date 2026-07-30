import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { verifyPassword, createSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const user = db.select().from(users).where(eq(users.username, username)).get()
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await createSession(user.id)
    return NextResponse.json({ username: user.username, role: user.role })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
