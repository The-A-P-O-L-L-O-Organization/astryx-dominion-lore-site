export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    if (body && typeof body.error === 'string') return body.error;
  } catch {
    // response had no JSON body; fall through to the generic message
  }
  return fallback;
}

/** Performs a fetch and throws an ApiError when the request fails. */
export async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (err) {
    throw new ApiError(
      err instanceof Error && err.message
        ? `Network error: ${err.message}`
        : 'Network error — please try again',
      0,
    );
  }
  if (!res.ok) {
    throw new ApiError(
      await readErrorMessage(res, `Request failed (${res.status})`),
      res.status,
    );
  }
  return res;
}

/** Like apiFetch, but parses the JSON body and throws when it is malformed. */
export async function apiJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(input, init);
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError('Received a malformed response from the server', 500);
  }
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
