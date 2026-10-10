import { Ban, Bookmark, ExternalLink } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { Badge } from './Badge';
import { CategoryChips, StatusPill } from './JobBadges';
import { capitalize, relTime, shortLocation } from '../lib/format';
import type { AppStatus, Job } from '../api/types';

export function JobCard({
  job,
  index = 0,
  onOpen,
  onQuickStatus,
  quickActions = true,
}: {
  job: Job;
  /** Position in the grid; drives the staggered entrance delay. */
  index?: number;
  onOpen: (id: number) => void;
  onQuickStatus?: (id: number, status: AppStatus) => void;
  quickActions?: boolean;
}) {
  // One quiet mono line instead of a wall of badges; the sponsor chip stays
  // because it is the one signal worth interrupting the scan for.
  const meta = [
    shortLocation(job),
    job.work_mode ? capitalize(job.work_mode) : null,
    job.seniority && job.seniority !== 'unknown' ? capitalize(job.seniority) : null,
    job.years_required != null ? `${job.years_required}+ yrs` : null,
  ]
    .filter((m) => m && m !== '—')
    .join(' · ');

  return (
    <div
      onClick={() => onOpen(job.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(job.id);
      }}
      tabIndex={0}
      role="button"
      aria-label={`${job.title} at ${job.company}`}
      className="group anim-rise min-w-0 cursor-pointer rounded-card border border-border bg-surface p-4 transition-colors duration-150 hover:border-accent/40 focus-visible:border-accent/40"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <div className="flex items-start gap-4">
        <ScoreRing score={job.fit_score} estimate={job.estimated_score} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-text">{job.title}</h3>
              <div className="mt-0.5 truncate text-xs text-muted">{job.company}</div>
            </div>
            <StatusPill value={job.application_status} />
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2 text-[11px] text-faint">
            <span className="min-w-0 truncate">{meta || '—'}</span>
            <span className="shrink-0" title={`First seen ${job.first_seen_at}`}>
              · {relTime(job.first_seen_at)}
            </span>
            {job.sponsorship === 'yes' && (
              <Badge variant="good" className="shrink-0">
                Sponsors visas
              </Badge>
            )}
          </div>
          {job.reason && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{job.reason}</p>
          )}
          <div className="mt-2.5 flex min-h-6 items-end justify-between gap-2">
            <CategoryChips cats={job.matched_categories} />
            {quickActions && (
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 max-lg:opacity-100">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2 py-1 text-[11px] font-medium text-text transition-colors duration-150 hover:border-accent/40 hover:text-accent"
                >
                  <ExternalLink className="size-3" /> Open
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickStatus?.(job.id, 'saved');
                  }}
                  aria-label="Save job"
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2 py-1 text-[11px] font-medium text-text transition-colors duration-150 hover:border-accent/40 hover:text-accent"
                >
                  <Bookmark className="size-3" /> Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickStatus?.(job.id, 'not_interested');
                  }}
                  aria-label="Mark not interested"
                  className="inline-flex items-center rounded-lg border border-border bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted transition-colors duration-150 hover:border-bad/40 hover:text-bad"
                >
                  <Ban className="size-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
