import { useState } from 'react';
import { useLatestRun, useStats, useToday, useUpdateApplication } from '../api/hooks';
import type { AppStatus, Job } from '../api/types';
import { JobCard } from '../components/JobCard';
import { JobDrawer } from '../components/JobDrawer';
import { StatTile } from '../components/StatTile';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
import { minutesUntil, relTime } from '../lib/format';
import { Sun } from 'lucide-react';

/** The next worker run is ~30 min after the previous one started. */
const RUN_INTERVAL_MIN = 30;

export default function TodayPage() {
  const { data, isLoading, error, refetch } = useToday();
  const stats = useStats();
  const latest = useLatestRun();
  const update = useUpdateApplication();
  const [drawerId, setDrawerId] = useState<number | null>(null);

  const jobs: Job[] = [...(data?.jobs ?? [])].sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0));
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

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">Today</h1>
          <p className="mt-1 text-xs text-muted">
            {jobs.length} new scored {jobs.length === 1 ? 'job' : 'jobs'} in the last 24h
            {lastRun && <> · last run {relTime(lastRun.started_at)}</>}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="New today" value={jobs.length} accent />
        <StatTile label="Strong fits (80+)" value={strong} />
        <StatTile label="Sponsors explicitly" value={sponsors} />
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
          title="No new matches since the last run"
          hint={`Next run in ~${nextIn} min. Come back after the worker cycles.`}
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onOpen={(id) => setDrawerId(id)}
              onQuickStatus={quickStatus}
            />
          ))}
        </div>
      )}

      {drawerId != null && <JobDrawer jobId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  );
}
