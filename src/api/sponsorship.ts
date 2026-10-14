import { keepPreviousData, useInfiniteQuery, type QueryClient } from '@tanstack/react-query';
import { api } from './client';

export type SponsorSignal = 'sponsors' | 'mixed' | 'does_not_sponsor' | 'unclear';

export interface SponsorshipStat {
  company_id: number;
  company: string;
  industry: string;
  open_jobs: number;
  analyzed: number;
  yes: number;
  no: number;
  unknown: number;
  signal: SponsorSignal;
  latest_quote: string | null;
  last_seen: string | null;
  h1b_filings: number | null;
  h1b_new_hires: number | null;
  h1b_median_wage: number | null;
}

export interface H1BPeriod {
  from: string | null;
  to: string | null;
}

/** Counts over every company, whatever page is loaded. */
export interface SponsorSummary {
  companies: number;
  filers: number;
  sponsors: number;
  mixed: number;
  does_not_sponsor: number;
}

export interface SponsorshipPage {
  companies: SponsorshipStat[];
  total: number;
  offset: number;
  summary: SponsorSummary;
  h1b_period: H1BPeriod;
}

export const SPONSORSHIP_PAGE = 40;

function sponsorshipQuery(q: string, filersOnly: boolean) {
  return {
    queryKey: ['sponsorship', q, filersOnly],
    queryFn: ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams({ limit: String(SPONSORSHIP_PAGE), offset: String(pageParam) });
      if (q) params.set('q', q);
      if (filersOnly) params.set('filers', '1');
      return api<SponsorshipPage>(`/api/sponsorship?${params}`);
    },
    initialPageParam: 0,
    getNextPageParam: (last: SponsorshipPage) => {
      const next = last.offset + last.companies.length;
      return next < last.total ? next : undefined;
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  };
}

/** Companies a page at a time, busiest H-1B filers first. */
export function useSponsorship(q: string, filersOnly = false) {
  return useInfiniteQuery({ ...sponsorshipQuery(q, filersOnly), placeholderData: keepPreviousData });
}

/** Loads the first page ahead of a visit (hovering the nav link). */
export function prefetchSponsorship(qc: QueryClient) {
  return qc.prefetchInfiniteQuery(sponsorshipQuery('', false));
}
