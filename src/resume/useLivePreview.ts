import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { previewResume, type Layout, type Measure, type ResumeData } from '../api/resumes';

/**
 * Renders the resume with the real engine ~half a second after edits stop
 * (stale requests are cancelled). Returns the SVG pages and measurements.
 */
export function useLivePreview(data: ResumeData | null, layout: Layout | null) {
  const [state, setState] = useState<{ pages: string[]; measure: Measure | null; loading: boolean; error: string }>({
    pages: [], measure: null, loading: true, error: '',
  });
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
        .then((r) => setState({ pages: r.pages, measure: r.measure, loading: false, error: '' }))
        .catch((e) => {
          if (c.signal.aborted) return;
          setState((s) => ({ ...s, loading: false, error: e instanceof ApiError ? e.message : 'Preview failed' }));
        });
    }, 550);
    return () => window.clearTimeout(t);
  }, [key]);
  useEffect(() => () => ctrl.current?.abort(), []);
  return state;
}
