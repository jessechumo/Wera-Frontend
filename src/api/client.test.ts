import { describe, expect, it, vi } from 'vitest';
import { api, ApiError, UNAUTHORIZED_EVENT } from './client';
import { jsonResponse, mockApi, jsonBody } from '../test/render';

describe('api', () => {
  it('sends JSON and parses the reply', async () => {
    const fetchMock = mockApi({ 'POST /api/things': (init) => ({ echo: jsonBody(init) }) });
    await expect(api('/api/things', { method: 'POST', body: JSON.stringify({ a: 1 }) })).resolves.toEqual({ echo: { a: 1 } });
    const init = fetchMock.mock.calls[0][1]!;
    expect(init.credentials).toBe('same-origin');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('returns undefined for 204', async () => {
    mockApi({ 'DELETE /api/things/1': () => undefined });
    await expect(api('/api/things/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('turns error bodies into ApiError with the server message', async () => {
    mockApi({ 'GET /api/bad': () => jsonResponse(422, { error: 'Titles need 8 to 140 characters.' }) });
    const err = await api('/api/bad').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 422, message: 'Titles need 8 to 140 characters.' });
  });

  it('says the server is not answering instead of showing a proxy\'s error page', async () => {
    mockApi({
      'GET /api/down': () => new Response('<!DOCTYPE html><html><body>Cloudflare Tunnel error</body></html>', { status: 530 }),
      'GET /api/plain': () => new Response('upstream timed out', { status: 504 }),
    });
    const down = (await api('/api/down').catch((e: unknown) => e)) as ApiError;
    expect(down.status).toBe(530);
    expect(down.message).toMatch(/isn't answering \(error 530\)/);
    expect(await api('/api/plain').catch((e: unknown) => e)).toMatchObject({ message: 'upstream timed out' });
  });

  it('announces an expired session, except on auth routes', async () => {
    const seen = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, seen);
    mockApi({
      'GET /api/jobs': () => jsonResponse(401, { error: 'sign in' }),
      'POST /api/auth/login': () => jsonResponse(401, { error: 'wrong password' }),
    });
    await api('/api/jobs').catch(() => {});
    await api('/api/auth/login', { method: 'POST', body: '{}' }).catch(() => {});
    expect(seen).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, seen);
  });

  it('does not set a JSON content type for FormData', async () => {
    const fetchMock = mockApi({ 'POST /api/upload': () => ({ ok: true }) });
    await api('/api/upload', { method: 'POST', body: new FormData() });
    expect(fetchMock.mock.calls[0][1]!.headers).toBeUndefined();
  });
});
