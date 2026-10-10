import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DomainStat {
  domain: string;
  kind: 'technical' | 'behavioral';
  questions: number;
  answered: number;
  correct: number;
}

export interface Question {
  id: number;
  domain: string;
  kind: 'technical' | 'behavioral';
  difficulty: Difficulty;
  question: string;
  choices: string[];
}

export interface AnswerResult {
  correct: boolean;
  answer: number;
  explanation: string;
}

export function useDomains() {
  return useQuery({
    queryKey: ['interview', 'domains'],
    queryFn: () => api<{ domains: DomainStat[] }>('/api/interview/domains'),
  });
}

/** Fetches a fresh quiz each time it is started (no caching across rounds). */
export function useStartQuiz() {
  return useMutation({
    mutationFn: (v: { domain: string; difficulty: Difficulty | '' }) => {
      const sp = new URLSearchParams({ limit: '10' });
      if (v.domain) sp.set('domain', v.domain);
      if (v.difficulty) sp.set('difficulty', v.difficulty);
      return api<{ questions: Question[] }>(`/api/interview/quiz?${sp}`);
    },
  });
}

export function useAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; choice: number }) =>
      api<AnswerResult>(`/api/interview/questions/${v.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ choice: v.choice }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['interview', 'domains'] }),
  });
}
