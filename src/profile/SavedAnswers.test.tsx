import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SavedAnswer } from '../api/extension';
import { stubApi } from '../test/fixtures';
import { jsonBody, renderApp } from '../test/render';
import { Toasts } from '../lib/toast';
import { SavedAnswers } from './SavedAnswers';

const answer = (id: number, question: string, text: string, over: Partial<SavedAnswer> = {}): SavedAnswer => ({
  id, question, answer: text, kind: 'text', company: 'Acme', uses: 1, updated_at: new Date().toISOString(), ...over,
});

describe('SavedAnswers', () => {
  it('says what it is for when empty', async () => {
    stubApi();
    renderApp(<SavedAnswers />);
    expect(await screen.findByText(/None yet/)).toBeInTheDocument();
  });

  it('searches, edits and forgets answers', async () => {
    let list = [answer(1, 'What is your notice period?', 'Two weeks', { uses: 3 }), answer(2, 'Why Acme?', 'Robots at scale.', { kind: 'long', company: '' })];
    const forgotten: string[] = [];
    stubApi({
      'GET /api/applicant/answers': () => ({ answers: list }),
      'PATCH /api/applicant/answers/1': (init) => {
        list = list.map((a) => (a.id === 1 ? { ...a, answer: jsonBody<{ answer: string }>(init).answer } : a));
        return { answers: list };
      },
      'DELETE /api/applicant/answers/2': () => (forgotten.push('2'), (list = list.filter((a) => a.id !== 2)), new Response(null, { status: 204 })),
      'DELETE /api/applicant/answers': () => (forgotten.push('all'), (list = []), new Response(null, { status: 204 })),
    });
    renderApp(<><SavedAnswers /><Toasts /></>);
    expect(await screen.findByText('Two weeks')).toBeInTheDocument();
    expect(screen.getByText(/Last given for Acme, .* used 3 times/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search saved answers'), 'robots');
    expect(screen.queryByText('Two weeks')).toBeNull();
    expect(screen.getByText('Robots at scale.')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Search saved answers'));

    await userEvent.click(screen.getByRole('button', { name: 'Edit the answer to What is your notice period?' }));
    const box = screen.getByLabelText('Answer to What is your notice period?');
    await userEvent.clear(box);
    await userEvent.type(box, 'One month');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('One month')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Forget the answer to Why Acme?' }));
    await waitFor(() => expect(screen.queryByText('Robots at scale.')).toBeNull());

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await userEvent.click(within(screen.getByRole('list').parentElement!).getByRole('button', { name: 'Forget all' }));
    expect(await screen.findByText(/None yet/)).toBeInTheDocument();
    expect(forgotten).toEqual(['2', 'all']);
  });
});
