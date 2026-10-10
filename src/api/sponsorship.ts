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
}

export function useSponsorship(q: string) {
  return useQuery({
    queryKey: ['sponsorship', q],
    queryFn: () =>
      api<{ companies: SponsorshipStat[] }>(`/api/sponsorship?limit=200${q ? `&q=${encodeURIComponent(q)}` : ''}`),
    placeholderData: keepPreviousData,
  });
}
