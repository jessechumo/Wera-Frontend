import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { H1BPeriod } from './sponsorship';

export interface H1BCount {
  label: string;
  filings: number;
  median_wage: number | null;
  min_wage?: number | null;
  max_wage?: number | null;
}

export interface H1BDetail {
  names: string[];
  filings: number;
  new_hires: number;
  positions: number;
  wage_p25: number | null;
  wage_median: number | null;
  wage_p75: number | null;
  titles: H1BCount[];
  places: H1BCount[];
  levels: H1BCount[];
  period: H1BPeriod;
}

export interface H1BEmployer {
  key: string;
  name: string;
  filings: number;
  median_wage: number | null;
  company_id: number | null;
}

export interface JobH1B {
  matched: boolean;
  company_id: number;
  filings: number;
  new_hires: number;
  wage_median: number | null;
  similar: { title: string; wage_from: number | null; wage_to: number | null; level: string; place: string; date: string }[];
  similar_low: number | null;
  similar_median: number | null;
  similar_high: number | null;
  level: string;
  period: H1BPeriod;
}

/** A tracked company's filings, or any employer's by key. */
export function useH1BDetail(target: { companyId: number } | { key: string } | null) {
  const path = !target
    ? ''
    : 'companyId' in target
      ? `/api/sponsorship/${target.companyId}/h1b`
      : `/api/h1b/employer?key=${encodeURIComponent(target.key)}`;
  return useQuery({ queryKey: ['h1b', path], queryFn: () => api<H1BDetail>(path), enabled: !!target, staleTime: 3_600_000 });
}

export function useH1BEmployers(q: string) {
  return useQuery({
    queryKey: ['h1b-employers', q],
    queryFn: () => api<{ employers: H1BEmployer[] }>(`/api/h1b/employers?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
  });
}

/** The prevailing wage level a seniority usually files at. */
export function wageLevelFor(seniority: string | null | undefined): string {
  const s = (seniority ?? '').toLowerCase();
  if (/intern|entry|junior|new grad/.test(s)) return 'I';
  if (/mid/.test(s)) return 'II';
  if (/senior/.test(s)) return 'III';
  if (/staff|principal|lead|director/.test(s)) return 'IV';
  return '';
}

export function useJobH1B(jobId: number, seniority?: string | null) {
  const level = wageLevelFor(seniority);
  return useQuery({
    queryKey: ['job-h1b', jobId, level],
    queryFn: () => api<JobH1B>(`/api/jobs/${jobId}/h1b${level ? `?level=${level}` : ''}`),
    staleTime: 3_600_000,
  });
}
