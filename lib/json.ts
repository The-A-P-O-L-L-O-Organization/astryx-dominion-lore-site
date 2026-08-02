/** Parses JSON, attaching the source description to the thrown error. */
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

/**
 * Parses JSON stored in the database. Corrupt values are logged and replaced
 * with the fallback so a single bad row cannot take a whole page down.
 */
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
