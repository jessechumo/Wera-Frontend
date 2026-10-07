export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Same-origin fetch wrapper: relative paths only, so it works unchanged
// behind the Vite dev proxy and behind nginx in production.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers:
      init?.body != null
        ? { 'Content-Type': 'application/json', ...init?.headers }
        : init?.headers,
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    const text = await res.text();
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string };
        message = parsed.error ?? message;
      } catch {
        message = text;
      }
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
