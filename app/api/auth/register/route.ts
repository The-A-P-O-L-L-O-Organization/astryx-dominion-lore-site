import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password || password.length < 6) {
      return NextResponse.json({ error: 'Username and password (min 6 chars) required' }, { status: 400 })
    }

    const existing = db.select().from(users).where(eq(users.username, username)).get()
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    db.insert(users).values({ username, passwordHash }).run()

    return NextResponse.json({ message: 'Account created. Wait for admin approval.' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
