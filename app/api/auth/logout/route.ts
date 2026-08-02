import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { errorResponse } from '@/lib/api-errors';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ message: 'Logged out' });
  } catch (err) {
    return errorResponse('POST /api/auth/logout', err);
  }
}
