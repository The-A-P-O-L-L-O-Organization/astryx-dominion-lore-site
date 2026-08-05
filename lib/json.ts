export function parseJsonOrThrow<T = Record<string, unknown>>(
  raw: string,
  source: string,
): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`Invalid JSON in ${source}`, { cause: err });
  }
}

export function parseJsonOrDefault<T>(
  raw: string | null | undefined,
  source: string,
  fallback: T,
): T {
  if (raw === null || raw === undefined || raw === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Invalid JSON in ${source}, using fallback:`, err);
    return fallback;
  }
}
