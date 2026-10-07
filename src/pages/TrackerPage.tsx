import { useState } from 'react';
import { useJobs, useUpdateApplication } from '../api/hooks';
import type { AppStatus, Job } from '../api/types';
import { JobDrawer } from '../components/JobDrawer';
import { StatusSelect } from '../components/StatusSelect';
import { Skeleton } from '../components/States';
import { relTime, verdictColor, verdictOf } from '../lib/format';
import clsx from 'clsx';
import { ExternalLink, EyeOff } from 'lucide-react';

const COLUMNS: AppStatus[] = ['saved', 'applied', 'interviewing', 'offer', 'rejected'];

const COLUMN_LABEL: Record<AppStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  not_interested: 'Not interested',
};

function KanbanCard({
  job,
  onOpen,
  onStatus,
}: {
  job: Job;
  onOpen: (id: number) => void;
  onStatus: (id: number, status: AppStatus) => void;
}) {
  const verdict = verdictOf(job.fit_score);
  return (
    <div className="group rounded-xl border border-border bg-surface p-3 transition-colors duration-150 hover:border-accent/40">
      <div
        onClick={() => onOpen(job.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onOpen(job.id);
        }}
        className="cursor-pointer"
        aria-label={`${job.title} at ${job.company}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 min-w-0 text-xs font-semibold text-text">{job.title}</h4>
          <span className={clsx('font-mono text-xs font-semibold', verdictColor[verdict])}>
            {job.fit_score ?? '—'}
          </span>
        </div>
        <div className="mt-1 truncate text-[11px] text-muted">{job.company}</div>
        <div className="mt-1 text-[10px] text-faint">
          {job.application_status === 'applied'
            ? 'first seen '
            : ''}
          {relTime(job.first_seen_at)}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <StatusSelect
          value={job.application_status}
          onChange={(s) => onStatus(job.id, s)}
          className="min-w-0 flex-1"
          label={`Status for ${job.title}`}
        />
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open posting"
          className="shrink-0 rounded-lg border border-border bg-surface-2 p-1.5 text-muted transition-colors duration-150 hover:border-accent/40 hover:text-accent"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

function Column({
  status,
  onOpen,
  onStatus,
}: {
  status: AppStatus;
  onOpen: (id: number) => void;
  onStatus: (id: number, status: AppStatus) => void;
}) {
  const { data, isLoading } = useJobs({ status, limit: 100, sort: 'newest' });
  const jobs = data?.jobs ?? [];
  return (
    <section className="flex min-w-0 flex-col rounded-card border border-border bg-surface/60 p-2.5">
      <header className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-text">{COLUMN_LABEL[status]}</h3>
        <span className="font-mono text-xs text-faint">{jobs.length}</span>
      </header>
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : jobs.length === 0 ? (
          <p className="px-1 py-4 text-center text-[11px] text-faint">Nothing here yet</p>
        ) : (
          jobs.map((job) => (
            <KanbanCard key={job.id} job={job} onOpen={onOpen} onStatus={onStatus} />
          ))
        )}
      </div>
    </section>
  );
}

export default function TrackerPage() {
  const update = useUpdateApplication();
  const [showNI, setShowNI] = useState(false);
  const [drawerId, setDrawerId] = useState<number | null>(null);

  const onStatus = (id: number, status: AppStatus) =>
    update.mutate({ id, status, notes: '' });

  const columns = showNI ? [...COLUMNS, 'not_interested' as AppStatus] : COLUMNS;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">Tracker</h1>
          <p className="mt-1 text-xs text-muted">
            Move jobs through the pipeline with the status menu on each card.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted select-none">
          <input
            type="checkbox"
            checked={showNI}
            onChange={(e) => setShowNI(e.target.checked)}
            className="size-3.5 accent-accent"
          />
          <EyeOff className="size-3.5" />
          Show not interested
        </label>
      </header>

      <div
        className={clsx(
          'grid gap-3 sm:grid-cols-2 xl:grid-cols-5',
          showNI && 'xl:grid-cols-6',
        )}
      >
        {columns.map((status) => (
          <Column key={status} status={status} onOpen={(id) => setDrawerId(id)} onStatus={onStatus} />
        ))}
      </div>

      {drawerId != null && <JobDrawer jobId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  );
}
