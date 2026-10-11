import { keepPreviousData, useQuery } from '@tanstack/react-query';
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

export function useSponsorship(q: string) {
  return useQuery({
    queryKey: ['sponsorship', q],
    queryFn: () =>
      api<{ companies: SponsorshipStat[]; h1b_period: H1BPeriod }>(`/api/sponsorship?limit=1000${q ? `&q=${encodeURIComponent(q)}` : ''}`),
    placeholderData: keepPreviousData,
  });
}
