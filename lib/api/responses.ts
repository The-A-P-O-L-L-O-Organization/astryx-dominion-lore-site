import { NextResponse } from 'next/server';

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function badRequest(message = 'Bad request'): NextResponse {
  return jsonError(message, 400);
}

export function unauthorized(message = 'Unauthorized'): NextResponse {
  return jsonError(message, 401);
}

export function notFound(message = 'Not found'): NextResponse {
  return jsonError(message, 404);
}

export function serverError(message = 'Internal server error'): NextResponse {
  return jsonError(message, 500);
}

export async function withGuard<T>(
  guard: () => Promise<T>,
  handler: (guarded: T) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  try {
    return await handler(await guard());
  } catch {
    return unauthorized();
  }
}

export function parseNumericId(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}
