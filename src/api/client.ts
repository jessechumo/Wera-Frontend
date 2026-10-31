export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** The message to show for a failed request: the server's, or `fallback` when it never answered. */
export function errorMessage(err: unknown, fallback = 'Network error'): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** Like errorMessage, but null when there is no error (for optional error slots). */
export function errorOrNull(err: unknown): string | null {
  return err ? errorMessage(err) : null;
}

/**
 * What a failed response says: the API's own error, a short plain-text
 * reason, or (for a proxy's HTML error page when the API is down) what
 * happened in words, never the page itself.
 */
export function failureMessage(res: { status: number; statusText: string }, text: string): string {
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === 'string' && parsed.error) return parsed.error;
  } catch {
    // not JSON
  }
  const plain = text.trim();
  if (plain && plain.length <= 200 && !/^</.test(plain)) return plain;
  if ((res.status >= 502 && res.status <= 504) || res.status >= 520) {
    return `Wera's server isn't answering (error ${res.status}). It may be restarting; try again in a minute.`;
  }
  return `${res.status} ${res.statusText}`.trim();
}

/**
 * For useQuery's refetchInterval: ask again every 10 seconds while the last
 * try failed, since a server coming back fires no event a page can hear.
 */
export const retryWhileDown = (query: { state: { status: string } }) => (query.state.status === 'error' ? 10_000 : false);

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
  if (!res.ok) throw new ApiError(res.status, failureMessage(res, await res.text().catch(() => '')));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
