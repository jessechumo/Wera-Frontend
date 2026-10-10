import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';
import type { User } from './types';

/** The logged-in user, or null when there is no session. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const me = await api<{ user: User; avatar_version: number | null }>('/api/auth/me');
        return { ...me.user, avatar_version: me.avatar_version };
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
      // A different user may have been cached: drop their data, keep the
      // "me" query mounted and point it at the new user.
      signOutLocally(qc);
      qc.setQueryData(['me'], user);
    },
  });
}

/**
 * Forgets the signed-in user and everything cached for them. The "me"
 * query is set to null in place (not cleared): clear() would detach the
 * mounted components watching it, so the route guard would never
 * re-render to send the user to the login page.
 */
export function signOutLocally(qc: QueryClient) {
  qc.setQueryData(['me'], null);
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => signOutLocally(qc),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (v: { current_password: string; new_password: string }) =>
      api<void>('/api/auth/password', { method: 'PUT', body: JSON.stringify(v) }),
  });
}

/**
 * Delete the account (password required); the session ends with it. The
 * caller reloads the app afterwards so nothing of the account stays cached.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) =>
      api<void>('/api/auth/account', { method: 'DELETE', body: JSON.stringify({ password }) }),
  });
}

/** Upload (file) or remove (null) the profile picture. */
export function useAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File | null) => {
      if (!file) return api<unknown>('/api/profile/avatar', { method: 'DELETE' });
      const form = new FormData();
      form.append('file', file);
      return api<unknown>('/api/profile/avatar', { method: 'PUT', body: form });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
