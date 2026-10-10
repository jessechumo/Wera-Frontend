import { act, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { UNAUTHORIZED_EVENT } from '../api/client';
import { me, profile, stubApi } from '../test/fixtures';
import { jsonResponse } from '../test/render';
import { RequireAdmin } from './RequireAdmin';
import { RequireAuth } from './RequireAuth';
import { RequireProfile } from './RequireProfile';

function app(path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/welcome" element={<p>welcome page</p>} />
          <Route element={<RequireAuth />}>
            <Route element={<RequireProfile />}>
              <Route path="/" element={<p>today page</p>} />
              <Route element={<RequireAdmin />}>
                <Route path="/system" element={<p>system page</p>} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('route guards', () => {
  it('sends signed-out visitors to login', async () => {
    stubApi({ 'GET /api/auth/me': () => jsonResponse(401, { error: 'sign in' }) });
    app();
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('sends users without a finished profile to setup', async () => {
    stubApi({ 'GET /api/profile': () => ({ ...profile, ready: false }) });
    app();
    expect(await screen.findByText('welcome page')).toBeInTheDocument();
  });

  it('lets ready users in and keeps non-admins out of System', async () => {
    stubApi({ 'GET /api/auth/me': () => ({ user: { ...me, is_admin: false }, avatar_version: null }) });
    app('/system');
    expect(await screen.findByText('today page')).toBeInTheDocument();
  });

  it('admins reach System', async () => {
    stubApi();
    app('/system');
    expect(await screen.findByText('system page')).toBeInTheDocument();
  });

  it('a 401 anywhere ends the session', async () => {
    let signedIn = true;
    stubApi({
      'GET /api/auth/me': () => (signedIn ? { user: me, avatar_version: null } : jsonResponse(401, { error: 'sign in' })),
    });
    app();
    await screen.findByText('today page');
    signedIn = false; // the session expired on the server
    act(() => {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    });
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
