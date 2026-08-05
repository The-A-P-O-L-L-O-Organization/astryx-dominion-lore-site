export interface JsonResult<T> {
  ok: boolean;
  data: T;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json();
}

export async function requestJson<T = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
): Promise<JsonResult<T>> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() };
}
