import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { prefetchResumes } from '../api/resumes';
import { prefetchSponsorship } from '../api/sponsorship';

/** Data a page needs first, loaded ahead of a visit. */
const PREFETCH: Record<string, (qc: QueryClient) => Promise<unknown>> = {
  '/sponsorship': prefetchSponsorship,
  '/profile': prefetchResumes,
};

/** Starts loading a page's data (hovering or focusing its link). Failures are left for the page to show. */
export function prefetchRoute(qc: QueryClient, to: string) {
  void PREFETCH[to]?.(qc).catch(() => undefined);
}

/**
 * Once the dashboard is idle, loads the slower pages' data in the
 * background, so opening the resume or sponsorship pages is instant.
 */
export function useWarmup() {
  const qc = useQueryClient();
  useEffect(() => {
    const run = () => Object.keys(PREFETCH).forEach((to) => prefetchRoute(qc, to));
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 5_000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 2_000);
    return () => window.clearTimeout(id);
  }, [qc]);
}
