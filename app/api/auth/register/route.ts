import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth';
import { badRequest, jsonError, serverError } from '@/lib/api/responses';
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
      return jsonError('Too many registrations. Try again later.', 429);
    }

    const { username, password } = await request.json();
    if (!username || !password || password.length < 6) {
      return badRequest('Username and password (min 6 chars) required');
    }

    const existing = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();
    if (existing) {
      return jsonError('Username already taken', 409);
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
    return serverError();
  }
}
