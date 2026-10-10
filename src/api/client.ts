export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Fired when a request comes back 401: the session is gone. */
export const UNAUTHORIZED_EVENT = 'wera:unauthorized';

// Same-origin fetch wrapper: relative paths only, so it works unchanged
// behind the Vite dev proxy, nginx, and Vercel rewrites. The session is an
// HTTP-only cookie the browser sends on its own. FormData bodies keep the
// browser's multipart Content-Type.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const json = init?.body != null && !(init.body instanceof FormData);
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: json ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  });
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
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
