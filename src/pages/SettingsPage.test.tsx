import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderApp, jsonBody } from '../test/render';
import SettingsPage from './SettingsPage';

const settings = {
  theme: 'system', default_sort: 'score',
  notifications: { email_digest: true, frequency: 'daily', strong_matches: true, min_score: 80, product_updates: false },
  hidden_companies: [{ id: 9, name: 'Initech', industry: 'saas' }],
};

afterEach(() => vi.restoreAllMocks());

describe('SettingsPage', () => {
  it('saves each change and unhides companies', async () => {
    const saved: unknown[] = [];
    const fetchMock = mockApi({
      'GET /api/auth/me': () => ({ user: { id: 1, email: 'a@example.com', name: 'A', is_admin: false, created_at: '' }, avatar_version: null }),
      'GET /api/settings': () => settings,
      'GET /api/industries': () => ({ industries: [{ id: 'saas', label: 'SaaS' }] }),
      'PUT /api/settings': (init) => {
        saved.push(jsonBody(init));
        return { ...settings, ...(saved.at(-1) as object) };
      },
      'DELETE /api/companies/9/hidden': () => undefined,
    });
    renderApp(<SettingsPage />);

    await userEvent.click(await screen.findByRole('radio', { name: 'Weekly' }));
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).toMatchObject({ notifications: { frequency: 'weekly' } });
    expect(saved[0]).not.toHaveProperty('hidden_companies');

    await userEvent.click(screen.getByRole('switch', { name: 'Product updates' }));
    await waitFor(() => expect(saved).toHaveLength(2));
    expect(saved[1]).toMatchObject({ notifications: { frequency: 'weekly', product_updates: true } });

    expect(screen.getByText('Initech')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Unhide' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/companies/9/hidden', expect.objectContaining({ method: 'DELETE' })),
    );
  });
});

describe('SettingsPage: when things fail', () => {
  it('shows a failed first load with a way to retry, not an endless placeholder', async () => {
    mockApi({
      'GET /api/auth/me': () => ({ user: { id: 1, email: 'a@example.com', name: 'A', is_admin: false, created_at: '' }, avatar_version: null }),
      'GET /api/settings': () => jsonResponse(502, { error: 'bad gateway' }),
      'GET /api/industries': () => ({ industries: [] }),
    });
    renderApp(<SettingsPage />);
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});

describe('SettingsPage: export', () => {
  const job = (id: number, status: string, closed: string | null = null) => ({
    id, company: `Company ${id}`, title: `Role ${id}`, application_status: status, fit_score: 70, location_raw: 'Remote',
    url: `https://example.com/${id}`, application_notes: '', closed_at: closed,
  });

  it('exports everything tracked, past any page limit and including closed postings', async () => {
    const saved = Array.from({ length: 205 }, (_, i) => job(i + 1, 'saved'));
    const asked: string[] = [];
    let csv = '';
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => {
      void (b as Blob).text().then((t) => { csv = t; });
      return 'blob:csv';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    mockApi({
      'GET /api/auth/me': () => ({ user: { id: 1, email: 'a@example.com', name: 'A', is_admin: false, created_at: '' }, avatar_version: null }),
      'GET /api/settings': () => settings,
      'GET /api/industries': () => ({ industries: [] }),
      'GET /api/ext/tokens': () => ({ connections: [] }),
      'GET /api/jobs': (_init, url) => {
        asked.push(url.search);
        const status = url.searchParams.get('status');
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const limit = Number(url.searchParams.get('limit'));
        const all = status === 'saved' ? saved : status === 'applied' ? [job(900, 'applied', '2026-10-20T00:00:00Z')] : [];
        return { jobs: all.slice(offset, offset + limit), count: 0 };
      },
    });
    renderApp(<SettingsPage />);
    await userEvent.click(await screen.findByRole('button', { name: /Download CSV/ }));
    await waitFor(() => expect(csv).not.toBe(''));
    const rows = csv.trim().split('\n');
    expect(rows).toHaveLength(1 + 206);
    expect(csv).toContain('"Role 205"');
    expect(rows[0]).toContain('posting_closed');
    expect(rows.find((r) => r.includes('Role 900'))).toContain('2026-10-20');
    expect(asked.every((q) => q.includes('status='))).toBe(true); // never the top-scored page of all matches
  });

  it('keeps a job title from running as a spreadsheet formula', async () => {
    let csv = '';
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => {
      void (b as Blob).text().then((t) => { csv = t; });
      return 'blob:csv';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    mockApi({
      'GET /api/auth/me': () => ({ user: { id: 1, email: 'a@example.com', name: 'A', is_admin: false, created_at: '' }, avatar_version: null }),
      'GET /api/settings': () => settings,
      'GET /api/industries': () => ({ industries: [] }),
      'GET /api/ext/tokens': () => ({ connections: [] }),
      'GET /api/jobs': (_init, url) => ({ jobs: url.searchParams.get('status') === 'saved' ? [{ ...job(1, 'saved'), title: '=HYPERLINK("http://evil")' }] : [], count: 0 }),
    });
    renderApp(<SettingsPage />);
    await userEvent.click(await screen.findByRole('button', { name: /Download CSV/ }));
    await waitFor(() => expect(csv).not.toBe(''));
    expect(csv).toContain(`"'=HYPERLINK`);
  });
});

describe('SettingsPage: Chrome extension', () => {
  it('lists connected browsers and disconnects one', async () => {
    let connections = [{ id: 4, name: 'Chrome on Linux', created_at: '2026-10-01T00:00:00Z', last_used_at: null }];
    mockApi({
      'GET /api/auth/me': () => ({ user: { id: 1, email: 'a@example.com', name: 'A', is_admin: false, created_at: '' }, avatar_version: null }),
      'GET /api/settings': () => settings,
      'GET /api/industries': () => ({ industries: [] }),
      'GET /api/ext/tokens': () => ({ connections }),
      'DELETE /api/ext/tokens/4': () => {
        connections = [];
        return undefined;
      },
    });
    renderApp(<SettingsPage />);
    expect(await screen.findByText('Chrome on Linux')).toBeInTheDocument();
    expect(screen.getByText(/not used yet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    expect(await screen.findByText(/No browser connected/)).toBeInTheDocument();
  });
});
