import { useState } from 'react';
import { useExcluded } from '../api/hooks';
import type { Job } from '../api/types';
import { Badge } from '../components/Badge';
import { ErrorState, SkeletonRows } from '../components/States';
import { prettyReason, relTime } from '../lib/format';
import { ChevronDown, ExternalLink } from 'lucide-react';

const PAGE = 50;

// Full reason set from the fresh DB (rule layer + LLM verdicts).
const REASONS = [
  'title:no_category',
  'title:senior',
  'title:manager',
  'title:staff',
  'title:principal',
  'title:lead',
  'title:director',
  'title:head_of',
  'title:vp',
  'title:sr',
  'title:intern',
  'title:internship',
  'title:iii',
  'location:non_us',
  'sponsorship:explicit_no',
  'llm:years>3',
  'llm:sponsorship_no',
  'llm:senior',
  'llm:non_us',
];

function reasonVariant(reason: string): 'bad' | 'warn' | 'neutral' {
  if (reason.startsWith('llm:')) return 'warn';
  if (reason.startsWith('sponsorship:')) return 'bad';
  return 'neutral';
}

export default function ExcludedPage() {
  const [reason, setReason] = useState('');
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error, refetch } = useExcluded({
    reason: reason || undefined,
    limit: PAGE,
    offset,
  });
  const jobs = data?.jobs ?? [];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">Excluded</h1>
          <p className="mt-1 text-xs text-muted">
            Every job the filters dropped, with the evidence. Audit a few of each kind.
          </p>
        </div>
        <label className="relative flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-wide text-faint uppercase">Reason</span>
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setOffset(0);
            }}
            aria-label="Filter by reason"
            className="w-64 appearance-none rounded-lg border border-border bg-surface-2 py-1.5 pr-7 pl-2.5 text-xs font-medium text-text transition-colors duration-150 hover:border-accent/40"
          >
            <option value="">All reasons</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {prettyReason(r)} ({r})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 bottom-2 size-3.5 text-faint" />
        </label>
      </header>

      {isLoading ? (
        <SkeletonRows rows={8} />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'unknown error'}
          onRetry={() => void refetch()}
        />
      ) : jobs.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
          No excluded jobs for this reason.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="hidden w-full min-w-[760px] md:table">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-medium tracking-wide text-faint uppercase">
                  <th className="px-3 py-2.5">Title</th>
                  <th className="px-3 py-2.5">Company</th>
                  <th className="px-3 py-2.5">Reason</th>
                  <th className="px-3 py-2.5">Evidence</th>
                  <th className="px-3 py-2.5">Seen</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job: Job) => (
                  <tr key={job.id} className="border-b border-border/50 align-top">
                    <td className="max-w-56 truncate px-3 py-2.5 text-sm font-medium text-text">
                      {job.title}
                    </td>
                    <td className="max-w-40 truncate px-3 py-2.5 text-xs text-muted">{job.company}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={reasonVariant(job.exclude_reason ?? '')}>
                        {prettyReason(job.exclude_reason ?? '')}
                      </Badge>
                    </td>
                    <td className="max-w-96 px-3 py-2.5 text-xs text-muted">
                      <span className="line-clamp-2">“{job.exclude_evidence ?? '—'}”</span>
                    </td>
                    <td
                      className="px-3 py-2.5 text-xs whitespace-nowrap text-faint"
                      title={job.first_seen_at}
                    >
                      {relTime(job.first_seen_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open posting"
                        className="inline-flex text-faint transition-colors duration-150 hover:text-accent"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Stacked cards (<768px) */}
            <div className="grid gap-2 p-3 md:hidden">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-text">{job.title}</div>
                      <div className="truncate text-[11px] text-muted">{job.company}</div>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open posting"
                      className="shrink-0 text-faint hover:text-accent"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                  <div className="mt-2">
                    <Badge variant={reasonVariant(job.exclude_reason ?? '')}>
                      {prettyReason(job.exclude_reason ?? '')}
                    </Badge>
                  </div>
                  {job.exclude_evidence && (
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      “{job.exclude_evidence}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(offset - PAGE, 0))}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-accent/40 hover:text-text disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-xs text-faint">
              {offset + 1}–{offset + jobs.length}
            </span>
            <button
              disabled={jobs.length < PAGE}
              onClick={() => setOffset(offset + PAGE)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-accent/40 hover:text-text disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

