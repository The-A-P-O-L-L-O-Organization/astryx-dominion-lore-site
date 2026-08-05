import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyPassword, createSession } from '@/lib/auth';
import { badRequest, jsonError, serverError } from '@/lib/api/responses';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    if (
      isRateLimited(
        `login:${getClientIp(request)}`,
        LOGIN_LIMIT,
        LOGIN_WINDOW_MS,
      )
    ) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429 },
      );
    }

    const { username, password } = await request.json();
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 },
      );
    }
    if (!username || !password) {
      return badRequest('Username and password required');
    }

    const user = db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError('Invalid credentials', 401);
    }

    await createSession(user.id);
    return NextResponse.json({ username: user.username, role: user.role });
  } catch {
    return serverError();
  }
}
