import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi, renderApp } from '../test/render';
import InterviewPage from './InterviewPage';

const questions = [
  { id: 1, domain: 'Databases', kind: 'technical', difficulty: 'easy', question: 'What does an index speed up?',
    choices: ['Inserts', 'Lookups', 'Backups', 'Schema changes'] },
  { id: 2, domain: 'Behavioral', kind: 'behavioral', difficulty: 'medium', question: 'What does R stand for in STAR?',
    choices: ['Reflection', 'Result', 'Role', 'Risk'] },
];

describe('InterviewPage', () => {
  it('runs a quiz: answer, see the explanation, finish with a score', async () => {
    const fetchMock = mockApi({
      'GET /api/interview/domains': () => ({
        domains: [{ domain: 'Databases', kind: 'technical', questions: 3, answered: 0, correct: 0 }],
      }),
      'GET /api/interview/quiz': (_init, url) => {
        expect(url.searchParams.get('difficulty')).toBe('easy');
        return { questions };
      },
      'POST /api/interview/questions/1/answer': () => ({ correct: true, answer: 1, explanation: 'Indexes find rows fast.' }),
      'POST /api/interview/questions/2/answer': () => ({ correct: false, answer: 1, explanation: 'Close with the result.' }),
    });
    renderApp(<InterviewPage />);

    await userEvent.click(await screen.findByRole('radio', { name: 'Easy' }));
    await userEvent.click(screen.getByRole('button', { name: /Start 10 questions/ }));

    expect(await screen.findByText('What does an index speed up?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Lookups/ }));
    expect(await screen.findByText('Indexes find rows fast.')).toBeInTheDocument();
    expect(screen.getByText('Correct')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));

    // Keyboard answers work too: "a" picks the first choice.
    expect(await screen.findByText('What does R stand for in STAR?')).toBeInTheDocument();
    await userEvent.keyboard('a');
    expect(await screen.findByText(/The answer is B/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Finish/ }));

    expect(await screen.findByText('1/2')).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes('/answer'))).toHaveLength(2);
  });
});
