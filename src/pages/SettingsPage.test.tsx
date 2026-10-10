import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi, renderApp } from '../test/render';
import SettingsPage from './SettingsPage';

const settings = {
  theme: 'system', default_sort: 'score',
  notifications: { email_digest: true, frequency: 'daily', strong_matches: true, min_score: 80, product_updates: false },
  hidden_companies: [{ id: 9, name: 'Initech', industry: 'saas' }],
};

describe('SettingsPage', () => {
  it('saves each change and unhides companies', async () => {
    const saved: unknown[] = [];
    const fetchMock = mockApi({
      'GET /api/auth/me': () => ({ user: { id: 1, email: 'a@example.com', name: 'A', is_admin: false, created_at: '' }, avatar_version: null }),
      'GET /api/settings': () => settings,
      'GET /api/industries': () => ({ industries: [{ id: 'saas', label: 'SaaS' }] }),
      'PUT /api/settings': (init) => {
        saved.push(JSON.parse(String(init?.body)));
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
