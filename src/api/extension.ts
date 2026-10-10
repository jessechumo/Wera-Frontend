import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

/** What application forms ask beyond the profile (see /api/applicant). */
export interface Applicant {
  first_name: string;
  last_name: string;
  preferred_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  linkedin: string;
  github: string;
  portfolio: string;
  current_company: string;
  current_title: string;
  years_experience: string;
  school: string;
  degree: string;
  major: string;
  graduation_year: string;
  gpa: string;
  authorized_to_work: string;
  needs_sponsorship: string;
  willing_to_relocate: string;
  salary_expectation: string;
  start_date: string;
  how_heard: string;
  gender: string;
  pronouns: string;
  race: string;
  hispanic: string;
  veteran: string;
  disability: string;
}

/** A browser connected through the extension. */
export interface Connection {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

export function useApplicant() {
  return useQuery({
    queryKey: ['applicant'],
    queryFn: () => api<{ applicant: Applicant; saved: boolean }>('/api/applicant'),
  });
}

export function useSaveApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: Applicant) => api<{ applicant: Applicant; saved: boolean }>('/api/applicant', { method: 'PUT', body: JSON.stringify(a) }),
    onSuccess: (r) => qc.setQueryData(['applicant'], r),
  });
}

/** Details read off the stored resume (links and phone verbatim). */
export function useSuggestApplicant() {
  return useMutation({
    mutationFn: () => api<{ suggestions: Partial<Applicant> }>('/api/applicant/suggest', { method: 'POST' }),
  });
}

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: () => api<{ connections: Connection[] }>('/api/ext/tokens'),
  });
}

export function useDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/ext/tokens/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['connections'] }),
  });
}
