import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { previewResume, type Layout, type Measure, type ResumeData, type Review } from '../api/resumes';

export interface LivePreview {
  pages: string[];
  measure: Measure | null;
  review: Review | null;
  loading: boolean;
  error: string;
}

/**
 * Renders the resume with the real engine shortly after edits stop
 * (stale requests are cancelled): SVG pages, measurements and the review.
 */
export function useLivePreview(data: ResumeData | null, layout: Layout | null, delay = 450): LivePreview {
  const [state, setState] = useState<LivePreview>({ pages: [], measure: null, review: null, loading: true, error: '' });
  const key = useMemo(() => (data && layout ? JSON.stringify([data, layout]) : ''), [data, layout]);
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!key) return;
    const t = window.setTimeout(() => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      setState((s) => ({ ...s, loading: true }));
      const [d, l] = JSON.parse(key) as [ResumeData, Layout];
      previewResume(d, l, c.signal)
        .then((r) => setState({ pages: r.pages, measure: r.measure, review: r.review ?? null, loading: false, error: '' }))
        .catch((e) => {
          if (c.signal.aborted) return;
          setState((s) => ({ ...s, loading: false, error: e instanceof ApiError ? e.message : 'Preview failed' }));
        });
    }, delay);
    return () => window.clearTimeout(t);
  }, [key, delay]);
  useEffect(() => () => ctrl.current?.abort(), []);
  return state;
}
