import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { JobDetail } from '../api/types';
import { jsonResponse, mockApi, renderApp } from '../test/render';
import { CoverLetterPanel } from './CoverLetterPanel';

const job = { id: 5, company: 'Acme', title: 'Site Reliability Engineer' } as JobDetail;
const letter = (body: string, edited = false) => ({ body, model: 'm', edited, created_at: '', updated_at: '' });

describe('CoverLetterPanel', () => {
  it('writes a letter on request, then saves edits', async () => {
    let stored: ReturnType<typeof letter> | null = null;
    mockApi({
      'GET /api/auth/me': () => ({ user: { id: 1, email: 'a@example.com', name: 'Ada', is_admin: false, created_at: '' }, avatar_version: null }),
      'GET /api/jobs/5/cover-letter': () => stored ?? jsonResponse(404, { error: 'no letter' }),
      'POST /api/jobs/5/cover-letter': () => (stored = letter('Dear Hiring Team,\n\nI keep systems up.')),
      'PUT /api/jobs/5/cover-letter': (init) => (stored = letter(JSON.parse(String(init?.body)).body, true)),
    });
    renderApp(<CoverLetterPanel job={job} />);

    await userEvent.click(await screen.findByRole('button', { name: /Write my letter/ }));
    expect(await screen.findByText('I keep systems up.')).toBeInTheDocument();
    expect(screen.getByText('Hiring Team, Acme', { exact: false })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Edit/ }));
    const editor = screen.getByLabelText('Cover letter');
    expect(editor).toHaveValue('Dear Hiring Team,\n\nI keep systems up.');
    await userEvent.clear(editor);
    await userEvent.type(editor, 'Dear team, hello.');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Dear team, hello.')).toBeInTheDocument();
    expect(screen.getByText('Edited by you')).toBeInTheDocument();
  });
});
