import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Answers, MyUsage, Preferences, Profile, ProfileOptions, Suggestions } from './types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api<Profile>('/api/profile'),
    staleTime: 5 * 60_000,
  });
}

export function useProfileOptions() {
  return useQuery({
    queryKey: ['profile-options'],
    queryFn: () => api<ProfileOptions>('/api/profile/options'),
    staleTime: Infinity,
  });
}

/** Maps a matched category id (a role family or title override) to a label. */
export function useFamilyLabel(): (id: string) => string {
  const { data } = useProfileOptions();
  const labels = new Map((data?.role_families ?? []).map((f) => [f.id, f.label]));
  return (id) =>
    labels.get(id) ??
    labels.get(OVERRIDE_FAMILY[id] ?? '') ??
    id.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** Title overrides (roles.yaml) are reported under their own ids. */
const OVERRIDE_FAMILY: Record<string, string> = {
  mts_infra: 'infrastructure',
  mts_software: 'software_engineering',
};

export function useMyUsage() {
  return useQuery({
    queryKey: ['usage', 'me'],
    queryFn: () => api<MyUsage>('/api/usage/me'),
  });
}

/** Upload a resume PDF, or send pasted text instead. */
export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { file: File } | { text: string }) => {
      const form = new FormData();
      if ('file' in input) form.append('file', input.file);
      else form.append('text', input.text);
      return api<{ resume_chars: number; preview: string }>('/api/profile/resume', {
        method: 'POST',
        body: form,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export interface ProfileInput {
  markdown?: string;
  preferences: Preferences;
  answers: Answers;
}

/** Ask the AI what the resume suggests for the form; nothing is saved. */
export function useSuggestPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<Suggestions>('/api/profile/suggest', { method: 'POST' }),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['usage', 'me'] }),
  });
}

/** Ask the AI to draft profile text; nothing is saved. */
export function useDraftProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) =>
      api<{ markdown: string }>('/api/profile/draft', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['usage', 'me'] }),
  });
}

/** Save the profile; the API starts matching the user's jobs right away. */
export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Required<ProfileInput>) =>
      api<Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: (profile) => {
      qc.setQueryData(['profile'], profile);
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'profile' });
    },
  });
}
