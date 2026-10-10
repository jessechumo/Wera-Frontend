import { useState } from 'react';
import { Ban, Bookmark, ExternalLink, Sun } from 'lucide-react';
import { useLatestRun, useStats, useToday, useUpdateApplication } from '../api/hooks';
import type { AppStatus, Job } from '../api/types';
import { JobCard } from '../components/JobCard';
import { JobDrawer } from '../components/JobDrawer';
import { ScoreRing } from '../components/ScoreRing';
import { StatTile } from '../components/StatTile';
import { StatusPill } from '../components/JobBadges';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
import { minutesUntil, relTime, shortLocation } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** The next worker run is ~30 min after the previous one started. */
const RUN_INTERVAL_MIN = 30;

/** Today's best job, presented large above the grid. */
function TopPick({
  job,
  onOpen,
  onQuickStatus,
}: {
  job: Job;
  onOpen: (id: number) => void;
  onQuickStatus: (id: number, status: AppStatus) => void;
}) {
  const meta = [
    job.seniority,
    job.years_required != null ? `${job.years_required}+ yrs` : null,
    shortLocation(job),
    job.work_mode,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <div
      onClick={() => onOpen(job.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(job.id);
      }}
      tabIndex={0}
      role="button"
      aria-label={`Top pick: ${job.title} at ${job.company}`}
      className="anim-rise group cursor-pointer rounded-card border border-accent/25 bg-surface p-5 transition-colors duration-150 hover:border-accent/50"
    >
      <div className="flex flex-wrap items-start gap-5">
        <ScoreRing score={job.fit_score} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold tracking-widest text-accent uppercase">
              Top pick
            </span>
            <StatusPill value={job.application_status} />
          </div>
          <h2 className="mt-1.5 truncate text-lg font-semibold text-text">{job.title}</h2>
          <div className="mt-0.5 truncate text-sm text-muted">{job.company}</div>
          {job.reason && (
            <p className="mt-2 line-clamp-3 max-w-2xl text-xs leading-relaxed text-muted">
              {job.reason}
            </p>
          )}
          <div className="mt-2.5 font-mono text-[11px] text-faint">{meta || '—'}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-colors duration-150 hover:bg-accent/85"
          >
            <ExternalLink className="size-3.5" /> Open posting
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickStatus(job.id, 'saved');
            }}
            aria-label="Save job"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[11px] font-medium text-text transition-colors duration-150 hover:border-accent/40 hover:text-accent"
          >
            <Bookmark className="size-3.5" /> Save
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickStatus(job.id, 'not_interested');
            }}
            aria-label="Mark not interested"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors duration-150 hover:border-bad/40 hover:text-bad"
          >
            <Ban className="size-3.5" /> Not interested
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TodayPage() {
  useDocumentTitle('Today');
  const { data, isLoading, error, refetch } = useToday();
  const stats = useStats();
  const latest = useLatestRun();
  const update = useUpdateApplication();
  const [drawerId, setDrawerId] = useState<number | null>(null);

  const jobs: Job[] = [...(data?.jobs ?? [])].sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0));
  // /api/today is the review queue (not yet applied to or dismissed), so it
  // includes older jobs; "new" means first seen in the last 24h.
  const dayAgo = Date.now() - 24 * 60 * 60_000;
  const newToday = jobs.filter((j) => new Date(j.first_seen_at).getTime() >= dayAgo).length;
  const strong = jobs.filter((j) => (j.fit_score ?? 0) >= 80).length;
  const sponsors = jobs.filter((j) => j.sponsorship === 'yes').length;

  const lastRun = latest.data?.runs[0];
  const nextIn = Math.max(
    0,
    minutesUntil(lastRun?.started_at) + RUN_INTERVAL_MIN,
  );

  const quickStatus = (id: number, status: AppStatus) => {
    update.mutate({ id, status, notes: '' });
  };

  // Sparkline + delta from /api/stats: new jobs per day, most recent last.
  const perDay = stats.data?.new_per_day ?? [];
  const spark = perDay.slice(-14).map((d) => d.count);
  const yesterday = perDay.length >= 2 ? perDay[perDay.length - 2]!.count : null;
  const delta =
    yesterday != null && !stats.isLoading
      ? (() => {
          const diff = newToday - yesterday;
          const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
          return {
            text: `${sign}${Math.abs(diff)} vs yesterday`,
            tone: (diff > 0 ? 'good' : diff < 0 ? 'bad' : 'neutral') as
              | 'good'
              | 'bad'
              | 'neutral',
          };
        })()
      : undefined;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">Today</h1>
          <p className="mt-1 text-xs text-muted">
            {jobs.length} scored {jobs.length === 1 ? 'job' : 'jobs'} to review · {newToday} new in
            the last 24h
            {lastRun && <> · last run {relTime(lastRun.started_at)}</>}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="New today" value={newToday} accent spark={spark} delta={delta} />
        <StatTile label="Strong fits (80+)" value={strong} sub={`of ${jobs.length} to review`} />
        <StatTile label="Sponsors explicitly" value={sponsors} sub={`of ${jobs.length} to review`} />
        <StatTile label="Applied this week" value={stats.data?.applications_per_week ?? '—'} />
      </div>

      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'unknown error'}
          onRetry={() => void refetch()}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Sun className="size-5 text-faint" />}
          title="Nothing left to review"
          hint={`Every scored job is applied to or dismissed. Next run in ~${nextIn} min.`}
        />
      ) : (
        <>
          <TopPick job={jobs[0]!} onOpen={(id) => setDrawerId(id)} onQuickStatus={quickStatus} />
          {jobs.length > 1 && (
            <div className="grid gap-3 xl:grid-cols-2">
              {jobs.slice(1).map((job, i) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={i + 1}
                  onOpen={(id) => setDrawerId(id)}
                  onQuickStatus={quickStatus}
                />
              ))}
            </div>
          )}
        </>
      )}

      {drawerId != null && <JobDrawer jobId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  );
}
