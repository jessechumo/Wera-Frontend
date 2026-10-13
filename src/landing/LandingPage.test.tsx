import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RequireAuth } from '../auth/RequireAuth';
import { stubApi } from '../test/fixtures';
import { renderApp } from '../test/render';

describe('landing page', () => {
  it('greets signed-out visitors at the front door with live numbers', async () => {
    stubApi({
      'GET /api/auth/me': () => new Response('{}', { status: 401 }),
      'GET /api/public/stats': () => ({ companies: 572, industries: 28, open_jobs: 43742, h1b_filings: 495460, h1b_employers: 57990 }),
    });
    renderApp(
      <Routes>
        <Route element={<RequireAuth />}><Route index element={<p>today</p>} /></Route>
      </Routes>,
      { path: '/' },
    );
    expect(await screen.findByRole('heading', { level: 1, name: /Find the jobs that fit you/ })).toBeInTheDocument();
    expect(await screen.findByText('495.5k')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Get started/ })[0]).toHaveAttribute('href', '/signup');
    expect(screen.getAllByRole('link', { name: /Log in/ })[0]).toHaveAttribute('href', '/login');
  });

  it('sends signed-out visitors elsewhere to log in', async () => {
    stubApi({ 'GET /api/auth/me': () => new Response('{}', { status: 401 }) });
    renderApp(
      <Routes>
        <Route element={<RequireAuth />}><Route path="jobs" element={<p>jobs</p>} /></Route>
        <Route path="login" element={<p>login page</p>} />
      </Routes>,
      { path: '/jobs' },
    );
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
