import { describe, expect, it, vi } from 'vitest';
import { api, ApiError, UNAUTHORIZED_EVENT } from './client';
import { jsonResponse, mockApi } from '../test/render';

describe('api', () => {
  it('sends JSON and parses the reply', async () => {
    const fetchMock = mockApi({ 'POST /api/things': (init) => ({ echo: JSON.parse(String(init?.body)) }) });
    await expect(api('/api/things', { method: 'POST', body: JSON.stringify({ a: 1 }) })).resolves.toEqual({ echo: { a: 1 } });
    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.credentials).toBe('same-origin');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('returns undefined for 204', async () => {
    mockApi({ 'DELETE /api/things/1': () => undefined });
    await expect(api('/api/things/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('turns error bodies into ApiError with the server message', async () => {
    mockApi({ 'GET /api/bad': () => jsonResponse(422, { error: 'Titles need 8 to 140 characters.' }) });
    const err = await api('/api/bad').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 422, message: 'Titles need 8 to 140 characters.' });
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
    expect(fetchMock.mock.calls[0]![1]!.headers).toBeUndefined();
  });
});
