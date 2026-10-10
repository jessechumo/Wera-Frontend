import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { api, ApiError } from './client';
import { toast } from '../lib/toast';
import type {
  AppStatus,
  CompaniesList,
  Job,
  JobDetail,
  JobList,
  CoverLetter,
  IndustriesList,
  SettingsView,
  Settings,
  RunsList,
  Stats,
  Usage,
} from './types';

export interface JobsParams {
  q?: string;
  industry?: string;
  category?: string;
  min_score?: number;
  sponsorship?: string;
  work_mode?: string;
  status?: string;
  since?: string;
  include_excluded?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface ExcludedParams {
  reason?: string;
  limit?: number;
  offset?: number;
}

function toQuery(params: object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/**
 * The review queue. It polls every 4s while scores are still arriving
 * (jobs pending, or the profile was saved in the last 3 minutes), else
 * every 5 minutes.
 */
export function useToday(profileUpdatedAt?: string) {
  return useQuery({
    queryKey: ['today'],
    queryFn: () => api<JobList>('/api/today'),
    refetchInterval: (query) => {
      const pending = (query.state.data?.pending ?? 0) > 0;
      const justSaved =
        profileUpdatedAt != null && Date.now() - new Date(profileUpdatedAt).getTime() < 3 * 60_000;
      return pending || justSaved ? 4_000 : 5 * 60_000;
    },
  });
}

export function useJobs(params: JobsParams) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => api<JobList>(`/api/jobs${toQuery(params)}`),
  });
}

export function useJob(id: number | null) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => api<JobDetail>(`/api/jobs/${id}`),
    enabled: id != null,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api<Stats>('/api/stats'),
    refetchInterval: 5 * 60_000,
  });
}

export function useRuns(limit = 10) {
  return useQuery({
    queryKey: ['runs', limit],
    queryFn: () => api<RunsList>(`/api/runs?limit=${limit}`),
  });
}

/** Latest run; polls every 5s while a run is in flight (status is null). */
export function useLatestRun() {
  return useQuery({
    queryKey: ['runs', 'latest'],
    queryFn: () => api<RunsList>('/api/runs?limit=1'),
    refetchInterval: (query) =>
      query.state.data?.runs[0]?.status == null ? 5_000 : false,
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => api<CompaniesList>('/api/companies'),
  });
}

export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: () => api<Usage>('/api/usage'),
    refetchInterval: 5 * 60_000,
  });
}

export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    queryFn: () => api<IndustriesList>('/api/industries'),
    staleTime: 5 * 60_000,
  });
}

/** Maps an industry id to its label (the id itself until labels load). */
export function useIndustryLabel(): (id: string) => string {
  const { data } = useIndustries();
  const labels = new Map((data?.industries ?? []).map((i) => [i.id, i.label]));
  return (id) => labels.get(id) ?? id;
}

export function useExcluded(params: ExcludedParams) {
  return useQuery({
    queryKey: ['excluded', params],
    queryFn: () => api<JobList>(`/api/excluded${toQuery(params)}`),
  });
}

/** Optimistic application update across the job detail + every list. */
export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; status: AppStatus; notes?: string }) =>
      api<JobDetail>(`/api/jobs/${v.id}/application`, {
        method: 'PUT',
        body: JSON.stringify(v),
      }),
    onMutate: async (v) => {
      await qc.cancelQueries();
      const prev = new Map<QueryKey, unknown>();
      const patch = (j: Job): Job =>
        j.id === v.id
          ? { ...j, application_status: v.status, application_notes: v.notes ?? j.application_notes }
          : j;
      const lists = [
        ...qc.getQueriesData<JobList>({ queryKey: ['jobs'] }),
        ...qc.getQueriesData<JobList>({ queryKey: ['today'] }),
      ];
      for (const [key, data] of lists) {
        if (!data) continue;
        prev.set(key, data);
        qc.setQueryData(key, { ...data, jobs: data.jobs.map(patch) });
      }
      const job = qc.getQueryData<JobDetail>(['job', v.id]);
      if (job) {
        prev.set(['job', v.id], job);
        qc.setQueryData(['job', v.id], { ...patch(job), deep: job.deep });
      }
      return { prev };
    },
    onError: (err, _v, ctx) => {
      for (const [key, data] of ctx?.prev ?? []) qc.setQueryData(key, data);
      toast.error(`Couldn't save: ${err instanceof ApiError ? err.message : 'network error'}`);
    },
    // Invalidate everything so all pages settle to server truth.
    onSettled: async () => {
      await qc.invalidateQueries();
    },
  });
}

/** POST /api/runs; surfaces the 409 "already running" case as a friendly toast. */
export function useTriggerRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ status: string }>('/api/runs', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Run started');
      void qc.invalidateQueries({ queryKey: ['runs'] });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'network error';
      toast.error(
        err instanceof ApiError && err.status === 409
          ? 'A run is already in progress'
          : `Couldn't start a run: ${msg}`,
      );
    },
  });
}

/** API health, with the version it runs (from /healthz). */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/healthz');
      if (!res.ok) throw new ApiError(res.status, 'unhealthy');
      const body = (await res.json().catch(() => ({}))) as { version?: string; commit?: string };
      return { version: body.version ?? 'unknown', commit: body.commit ?? '' };
    },
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  });
}

/** Score one unscored job now (the user opened it); merges into the cache. */
export function useScoreJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<Job>(`/api/jobs/${id}/score`, { method: 'POST' }),
    onSuccess: (job) => {
      qc.setQueryData<JobDetail>(['job', job.id], (prev) => (prev ? { ...prev, ...job } : prev));
      void qc.invalidateQueries({ queryKey: ['today'] });
      void qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => api<SettingsView>('/api/settings') });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Settings) => api<SettingsView>('/api/settings', { method: 'PUT', body: JSON.stringify(s) }),
    onSuccess: (s) => qc.setQueryData(['settings'], s),
  });
}

/** Hide (true) or unhide (false) a company's jobs. */
export function useHideCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; hidden: boolean }) =>
      api<void>(`/api/companies/${v.id}/hidden`, { method: v.hidden ? 'PUT' : 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries(),
  });
}

export function useCoverLetter(jobId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['cover-letter', jobId],
    queryFn: async () => {
      try {
        return await api<CoverLetter>(`/api/jobs/${jobId}/cover-letter`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled,
    staleTime: Infinity,
  });
}

/** Generate (body undefined) or save edits (body set) for a job's letter. */
export function useWriteCoverLetter(jobId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: string) =>
      body === undefined
        ? api<CoverLetter>(`/api/jobs/${jobId}/cover-letter`, { method: 'POST' })
        : api<CoverLetter>(`/api/jobs/${jobId}/cover-letter`, { method: 'PUT', body: JSON.stringify({ body }) }),
    onSuccess: (c) => {
      qc.setQueryData(['cover-letter', jobId], c);
      void qc.invalidateQueries({ queryKey: ['usage', 'me'] });
    },
  });
}
