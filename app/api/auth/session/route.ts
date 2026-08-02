import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { errorResponse } from '@/lib/api-errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
      },
    });
  } catch (err) {
    return errorResponse('GET /api/auth/session', err);
  }
}
