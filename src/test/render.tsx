import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

/** Renders ui with a fresh query client and a router at path. */
export function renderApp(ui: ReactElement, { path = '/', route = '*' }: { path?: string; route?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={route} element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

type Handler = (init: RequestInit | undefined, url: URL) => unknown | Response;

/**
 * Stubs fetch with a table of "METHOD /path" handlers. A handler returns a
 * body (sent as JSON with 200) or a Response. Unmatched requests fail the
 * test with a 501 so missing stubs are obvious. Returns the mock to
 * inspect calls.
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const key = `${(init?.method ?? 'GET').toUpperCase()} ${url.pathname}`;
    const handler = routes[key];
    if (!handler) return new Response(JSON.stringify({ error: `no stub for ${key}` }), { status: 501 });
    const out = await handler(init, url);
    if (out instanceof Response) return out;
    return new Response(out === undefined ? null : JSON.stringify(out), {
      status: out === undefined ? 204 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
