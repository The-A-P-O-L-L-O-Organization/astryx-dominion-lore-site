import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth';
import { badRequest, jsonError } from '@/lib/api/responses';
import { getClientIp, isRateLimited } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';
import { errorResponse, parseJsonBody } from '@/lib/api-errors';

const REGISTER_LIMIT = 1;
const REGISTER_WINDOW_MS = 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)) {
      return jsonError('Too many registrations. Try again later.', 429);
    }

    const body = await parseJsonBody(request);
    const { username, password } = body as {
      username?: string;
      password?: string;
    };
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
  } catch (err) {
    return errorResponse('POST /api/auth/register', err);
  }
}
