import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';

const rateLimitMap = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const last = rateLimitMap.get(ip);
  if (last && now - last < 60000) return true;
  rateLimitMap.set(ip, now);
  return false;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many registrations. Try again later.' },
        { status: 429 },
      );
    }

    const { username, password } = await request.json();
    if (!username || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Username and password (min 6 chars) required' },
        { status: 400 },
      );
    }

    const existing = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();
    if (existing) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const userCount = db.select().from(users).all().length;
    const role = userCount === 0 ? 'admin' : 'player';

    db.insert(users).values({ username, passwordHash, role }).run();

    return NextResponse.json(
      { message: 'Account created', role },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
