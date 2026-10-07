import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useJobs, useUpdateApplication } from '../api/hooks';
import type { AppStatus } from '../api/types';
import { FilterBar, type FilterValues } from '../components/FilterBar';
import { JobCard } from '../components/JobCard';
import { JobDrawer } from '../components/JobDrawer';
import { JobRow } from '../components/JobRow';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE = 50;

function valuesFromParams(sp: URLSearchParams): FilterValues {
  return {
    q: sp.get('q') ?? '',
    group: sp.get('group') ?? '',
    category: sp.get('category') ?? '',
    min_score: Number(sp.get('min_score') ?? 0) || 0,
    sponsorship: sp.get('sponsorship') ?? '',
    work_mode: sp.get('work_mode') ?? '',
    status: sp.get('status') ?? '',
    sort: sp.get('sort') === 'newest' ? 'newest' : 'score',
  };
}

export default function JobsPage() {
  useDocumentTitle('Jobs');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const routeId = useParams<{ id?: string }>().id;

  const values = valuesFromParams(searchParams);
  const offset = Number(searchParams.get('offset') ?? 0) || 0;

  const params = useMemo(
    () => ({ ...values, limit: PAGE, offset }),
    [values, offset],
  );
  const { data, isLoading, error, refetch, isFetching } = useJobs(params);
  const update = useUpdateApplication();

  const jobs = data?.jobs ?? [];
  const drawerId = Number(searchParams.get('job') ?? routeId ?? '') || null;

  const [sel, setSel] = useState(0);
  useEffect(() => {
    setSel(0);
  }, [searchParams.toString()]);

  const patchParams = useCallback(
    (patch: Record<string, string | number>, opts?: { keepOffset?: boolean }) => {
      setSearchParams(
        (sp) => {
          const next = new URLSearchParams(sp);
          for (const [k, v] of Object.entries(patch)) {
            if (v === '' || v === 0) next.delete(k);
            else next.set(k, String(v));
          }
          if (!opts?.keepOffset) next.delete('offset');
          next.delete('job'); // filters changing invalidates the open drawer
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openDrawer = useCallback(
    (id: number) => {
      setSearchParams(
        (sp) => {
          const next = new URLSearchParams(sp);
          next.set('job', String(id));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const closeDrawer = useCallback(() => {
    if (routeId) {
      navigate('/jobs', { replace: true });
    } else {
      setSearchParams(
        (sp) => {
          const next = new URLSearchParams(sp);
          next.delete('job');
          return next;
        },
        { replace: true },
      );
    }
  }, [routeId, navigate, setSearchParams]);

  const quickStatus = (id: number, status: AppStatus) => update.mutate({ id, status, notes: '' });

  // Keyboard: j/k move selection, Enter opens, o opens the posting.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A') return;
      // While the drawer is open it owns the keyboard (esc, o).
      if (drawerId != null) return;
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        setSel((s) => {
          const next = e.key === 'j' ? s + 1 : s - 1;
          return Math.min(Math.max(next, 0), Math.max(jobs.length - 1, 0));
        });
      } else if (e.key === 'Enter') {
        const job = jobs[sel];
        if (job) openDrawer(job.id);
      } else if (e.key === 'o') {
        const job = jobs[sel];
        if (job) window.open(job.url, '_blank', 'noopener');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jobs, sel, openDrawer, drawerId]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">Jobs</h1>
          <p className="mt-1 text-xs text-muted">
            {isFetching ? 'Loading…' : `${jobs.length} shown${jobs.length === PAGE ? '+' : ''}`} ·{' '}
            <span className="font-mono">j/k</span> to move · <span className="font-mono">Enter</span>{' '}
            opens · <span className="font-mono">o</span> opens posting
          </p>
        </div>
      </header>

      <FilterBar
        values={values}
        onChange={(patch) => patchParams(patch)}
        onReset={() => {
          const next = new URLSearchParams();
          setSearchParams(next, { replace: true });
          void refetch();
        }}
      />

      {isLoading ? (
        <SkeletonRows rows={8} />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'unknown error'}
          onRetry={() => void refetch()}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs match these filters"
          hint="Try loosening the score minimum or clearing filters."
        />
      ) : (
        <>
          {/* Dense table (>=640px) */}
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="hidden w-full min-w-[860px] sm:table">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-medium tracking-wide text-faint uppercase">
                  <th className="w-14 px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Title</th>
                  <th className="px-3 py-2.5">Company</th>
                  <th className="px-3 py-2.5">Group</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Mode</th>
                  <th className="px-3 py-2.5">Sponsorship</th>
                  <th className="px-3 py-2.5">First seen</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, i) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    index={i}
                    selected={i === sel}
                    onOpen={openDrawer}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked cards (<640px) */}
          <div className="grid gap-2.5 sm:hidden">
            {jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                onOpen={openDrawer}
                onQuickStatus={quickStatus}
                quickActions={false}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button
              disabled={offset === 0}
              onClick={() => patchParams({ offset: Math.max(offset - PAGE, 0) }, { keepOffset: true })}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-accent/40 hover:text-text disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" /> Previous
            </button>
            <span className="font-mono text-xs text-faint">
              {offset + 1}–{offset + jobs.length}
            </span>
            <button
              disabled={jobs.length < PAGE}
              onClick={() => patchParams({ offset: offset + PAGE }, { keepOffset: true })}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-accent/40 hover:text-text disabled:opacity-40"
            >
              Next <ChevronRight className="size-3.5" />
            </button>
          </div>
        </>
      )}

      {drawerId != null && <JobDrawer jobId={drawerId} onClose={closeDrawer} />}
    </div>
  );
}

