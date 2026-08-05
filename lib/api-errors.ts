import { NextResponse } from 'next/server';

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export class BadRequestError extends Error {
  constructor(message = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

export function isAuthError(err: unknown): boolean {
  if (err instanceof AuthError) return true;
  return (
    err instanceof Error &&
    (err.message === 'Unauthorized' || err.message === 'Forbidden')
  );
}

export function errorResponse(context: string, err: unknown): NextResponse {
  if (isAuthError(err)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (err instanceof BadRequestError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  console.error(`${context} failed:`, err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function parseJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new BadRequestError('Invalid JSON');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestError('Request body must be a JSON object');
  }
  return body as Record<string, unknown>;
}

export function requireString(
  body: Record<string, unknown>,
  field: string,
): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestError(`${field} is required`);
  }
  return value;
}

export function requireNumber(
  body: Record<string, unknown>,
  field: string,
): number {
  const value = Number(body[field]);
  if (!Number.isFinite(value)) {
    throw new BadRequestError(`${field} must be a number`);
  }
  return value;
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
  fallback = '',
): string {
  const value = body[field];
  return typeof value === 'string' ? value : fallback;
}
