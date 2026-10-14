import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AuthPage from '../auth/AuthPage';
import { AppShell } from '../layout/AppShell';
import { me, stubApi } from '../test/fixtures';
import { jsonResponse, renderApp } from '../test/render';
import CommunityPage from './CommunityPage';
import PostPage from './PostPage';
import SponsorshipPage from './SponsorshipPage';
import WelcomePage from './WelcomePage';

const author = { id: 2, name: 'Grace', avatar_version: null };
const summary = {
  id: 11, title: 'How I prepared for SRE loops', excerpt: 'Mock interviews **helped**.', tags: ['interviews'],
  author, created_at: '2026-10-09T00:00:00Z', read_minutes: 3, reactions: { insightful: 2 }, my_reactions: [],
  comment_count: 1, is_mine: false,
};

const signedOut = () => jsonResponse(401, { error: 'not signed in' });

describe('AuthPage', () => {
  it('shows the server error on a failed login', async () => {
    stubApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/login': () => jsonResponse(401, { error: 'wrong email or password' }),
    });
    renderApp(<AuthPage mode="login" />);
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'ada@example.com');
    await userEvent.type(document.querySelector('input[type=password]')!, 'not my password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('wrong email or password')).toBeInTheDocument();
  });

  it('signs up with a name', async () => {
    let body: Record<string, string> = {};
    stubApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/signup': (init) => {
        body = JSON.parse(String(init?.body));
        return { user: me };
      },
    });
    renderApp(<AuthPage mode="signup" />);
    await userEvent.type(screen.getByPlaceholderText('Your name'), 'Ada');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'ada@example.com');
    await userEvent.type(document.querySelector('input[type=password]')!, 'a long password');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(body).toMatchObject({ name: 'Ada', email: 'ada@example.com' }));
  });
});

describe('AppShell', () => {
  it('shows the navigation with Excluded below the everyday pages', async () => {
    stubApi();
    renderApp(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<p>page body</p>} />
        </Route>
      </Routes>,
    );
    expect(await screen.findByText('page body')).toBeInTheDocument();
    const labels = screen.getAllByRole('link').map((a) => a.textContent?.trim()).filter(Boolean);
    expect(labels.indexOf('Excluded')).toBeGreaterThan(labels.indexOf('Settings'));
    expect(labels).toEqual(expect.arrayContaining(['Today', 'Jobs', 'Community', 'Interview prep', 'Sponsorship']));
  });

  it('opens the command palette with Ctrl+K', async () => {
    stubApi();
    renderApp(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<p>page body</p>} />
        </Route>
      </Routes>,
    );
    await screen.findByText('page body');
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
  });
});

describe('WelcomePage', () => {
  it('walks the setup steps', async () => {
    stubApi({ 'GET /api/profile': () => ({ markdown: '', resume_text: '', resume_file: null, answers: {}, resume_chars: 0, ready: false, updated_at: null,
      preferences: { role_families: [], levels: ['entry'], max_years_required: 3, us_only: true, needs_sponsorship: false } }) });
    renderApp(<WelcomePage />);
    await userEvent.click(await screen.findByRole('button', { name: /Skip/ }));
    // Step 2: roles are listed alphabetically.
    const group = await screen.findByRole('group', { name: 'Role families' });
    const roles = within(group).getAllByRole('button').map((b) => b.textContent ?? '');
    expect(roles).toEqual(['Data science', 'Platform engineering', 'Site reliability']);
    // Picking one enables Continue.
    await userEvent.click(within(group).getByRole('button', { name: 'Site reliability' }));
    expect(screen.getByRole('button', { name: /Continue/ })).toBeEnabled();
  });
});

describe('Community', () => {
  it('lists posts and filters by tag', async () => {
    stubApi({
      'GET /api/posts': (_init, url) =>
        url.searchParams.get('tag') === 'offers'
          ? { posts: [], tags: [{ tag: 'interviews', count: 1 }, { tag: 'offers', count: 0 }] }
          : { posts: [summary], tags: [{ tag: 'interviews', count: 1 }, { tag: 'offers', count: 0 }] },
    });
    renderApp(<CommunityPage />);
    expect(await screen.findByText('How I prepared for SRE loops')).toBeInTheDocument();
    expect(screen.getByText('Mock interviews helped.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /#offers/ }));
    expect(await screen.findByText('No posts tagged #offers yet')).toBeInTheDocument();
  });

  it('reads a post and comments on it', async () => {
    let post = { ...summary, body: '## Practice\n\nDo mock interviews.', comments: [] as unknown[] };
    stubApi({
      'GET /api/posts/11': () => post,
      'POST /api/posts/11/comments': (init) => {
        post = { ...post, comments: [{ id: 1, body: JSON.parse(String(init?.body)).body, author, created_at: '2026-10-10T00:00:00Z', is_mine: true }] };
        return post;
      },
    });
    renderApp(<PostPage />, { path: '/community/11', route: '/community/:id' });
    expect(await screen.findByRole('heading', { name: 'Practice' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Comment'), 'Very helpful, thanks');
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));
    expect(await screen.findByText('Very helpful, thanks')).toBeInTheDocument();
  });

  it('a missing post says so', async () => {
    stubApi({ 'GET /api/posts/99': () => jsonResponse(404, { error: 'post not found' }) });
    renderApp(<PostPage />, { path: '/community/99', route: '/community/:id' });
    expect(await screen.findByText('This post is no longer available.')).toBeInTheDocument();
  });
});

describe('SponsorshipPage', () => {
  const row = (name: string, signal: string, yes: number, no: number, filings: number | null = null) => ({
    company_id: name === 'Jump' ? 4 : 5, company: name, industry: 'trading', open_jobs: 10, analyzed: yes + no, yes, no,
    unknown: 0, signal, latest_quote: signal === 'sponsors' ? 'We sponsor visas.' : null, last_seen: null,
    h1b_filings: filings, h1b_new_hires: filings && 5, h1b_median_wage: filings && 163000,
  });
  const detail = {
    names: ['Jump Operations, LLC'], filings: 82, new_hires: 30, positions: 82, wage_p25: 150000, wage_median: 200000, wage_p75: 250000,
    titles: [{ label: 'Software Engineer', filings: 40, median_wage: 210000, min_wage: 180000, max_wage: 300000 }],
    places: [{ label: 'Chicago, IL', filings: 70, median_wage: 200000 }], levels: [{ label: 'II', filings: 50, median_wage: 190000 }],
    period: { from: '2025-07-01T00:00:00Z', to: '2026-06-30T00:00:00Z' },
  };

  it('shows filings and posting signals, and searches', async () => {
    stubApi({
      'GET /api/sponsorship': (_init, url) => {
        const all = [row('Jump', 'sponsors', 3, 0, 82), row('Acme', 'does_not_sponsor', 0, 4)];
        const companies = url.searchParams.get('q') || url.searchParams.get('filers') ? all.slice(0, 1) : all;
        return {
          companies, total: companies.length, offset: 0, h1b_period: detail.period,
          summary: { companies: 2, filers: 1, sponsors: 1, mixed: 0, does_not_sponsor: 1 },
        };
      },
      'GET /api/sponsorship/4/h1b': () => detail,
    });
    renderApp(<SponsorshipPage />);
    expect(await screen.findByText('Does not sponsor')).toBeInTheDocument();
    expect(screen.getByText('“We sponsor visas.”')).toBeInTheDocument();
    expect(screen.getByText('$163k')).toBeInTheDocument();
    expect(screen.getByText(/Jul 2025 – Jun 2026/)).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2')).toBeInTheDocument();

    await userEvent.click(screen.getByText('82'));
    expect(await screen.findByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Filed as Jump Operations, LLC/)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Only companies that file/));
    expect(screen.queryByText('Acme')).toBeNull();
    await userEvent.click(screen.getByLabelText(/Only companies that file/));
    await userEvent.type(screen.getByLabelText('Search companies'), 'jum');
    await waitFor(() => expect(screen.queryByText('Acme')).toBeNull());
  });

  it('looks up any employer', async () => {
    stubApi({
      'GET /api/sponsorship': () => ({
        companies: [], total: 0, offset: 0, h1b_period: detail.period,
        summary: { companies: 0, filers: 0, sponsors: 0, mixed: 0, does_not_sponsor: 0 },
      }),
      'GET /api/h1b/employers': () => ({ employers: [{ key: 'google', name: 'Google LLC', filings: 8229, median_wage: 193440, company_id: null }] }),
      'GET /api/h1b/employer': (_init, url) => (url.searchParams.get('key') === 'google' ? { ...detail, names: ['Google LLC'] } : new Response('{}', { status: 404 })),
    });
    renderApp(<SponsorshipPage />);
    await userEvent.type(await screen.findByLabelText('Employer name'), 'google');
    await userEvent.click(await screen.findByRole('button', { name: /Google LLC/ }));
    expect(await screen.findByText(/Filed as Google LLC/)).toBeInTheDocument();
  });
});

describe('SponsorshipPage paging', () => {
  it('loads the next page on demand', async () => {
    const make = (i: number) => ({
      company_id: 100 + i, company: `Co ${i}`, industry: 'trading', open_jobs: 1, analyzed: 0, yes: 0, no: 0, unknown: 0,
      signal: 'unclear', latest_quote: null, last_seen: null, h1b_filings: 10, h1b_new_hires: 1, h1b_median_wage: 100000,
    });
    const offsets: string[] = [];
    stubApi({
      'GET /api/sponsorship': (_init, url) => {
        const offset = Number(url.searchParams.get('offset'));
        offsets.push(String(offset));
        return {
          companies: offset === 0 ? [make(1), make(2)] : [make(3)], total: 3, offset, h1b_period: { from: null, to: null },
          summary: { companies: 3, filers: 3, sponsors: 0, mixed: 0, does_not_sponsor: 0 },
        };
      },
    });
    renderApp(<SponsorshipPage />);
    expect(await screen.findByText('Showing 2 of 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(await screen.findByText('Co 3')).toBeInTheDocument();
    expect(screen.getByText('Showing 3 of 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
    expect(offsets).toEqual(['0', '2']);
  });
});
