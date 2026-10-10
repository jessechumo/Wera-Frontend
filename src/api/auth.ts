import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';
import type { User } from './types';

/** The logged-in user, or null when there is no session. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api<{ user: User }>('/api/auth/me')).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export interface Credentials {
  email: string;
  password: string;
  name?: string;
}

/** Log in or sign up; on success the new session's user replaces any cached one. */
export function useAuthMutation(kind: 'login' | 'signup') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Credentials) =>
      api<{ user: User }>(`/api/auth/${kind}`, { method: 'POST', body: JSON.stringify(c) }),
    onSuccess: ({ user }) => {
      qc.clear();
      qc.setQueryData(['me'], user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(['me'], null);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (v: { current_password: string; new_password: string }) =>
      api<void>('/api/auth/password', { method: 'PUT', body: JSON.stringify(v) }),
  });
}
