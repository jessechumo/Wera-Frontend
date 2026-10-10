import clsx from 'clsx';
import { absTime, relTime, shortLocation, verdictColor, verdictOf } from '../lib/format';
import { IndustryBadge, SponsorshipBadge, StatusPill, WorkModeBadge, AddedBadge } from './JobBadges';
import type { Job } from '../api/types';

/** Dense table row for the Jobs page. */
export function JobRow({
  job,
  index = 0,
  selected,
  onOpen,
}: {
  job: Job;
  /** Position on the page; drives the staggered entrance delay. */
  index?: number;
  selected?: boolean;
  onOpen: (id: number) => void;
}) {
  const verdict = verdictOf(job.fit_score);
  return (
    <tr
      onClick={() => onOpen(job.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(job.id);
      }}
      tabIndex={0}
      aria-label={`${job.title} at ${job.company}`}
      className={clsx(
        'anim-rise cursor-pointer border-b border-border/60 transition-colors duration-150 hover:bg-surface-2/60',
        selected && 'bg-accent/5 ring-1 ring-accent/25 ring-inset',
      )}
      style={{ animationDelay: `${Math.min(index * 24, 360)}ms` }}
    >
      <td className="px-3 py-2.5">
        <span className={clsx('font-mono text-sm font-semibold', verdictColor[verdict])}>
          {job.fit_score ?? (job.estimated_score != null ? (
            <span className="text-faint" title="Estimated; the AI score is on its way">
              ~{job.estimated_score}
            </span>
          ) : (
            '—'
          ))}
        </span>
      </td>
      <td className="max-w-72 truncate px-3 py-2.5 text-sm font-medium text-text">{job.title}</td>
      <td className="max-w-44 truncate px-3 py-2.5 text-sm text-muted">
        {job.company} {job.source === 'manual' && <AddedBadge source={job.source} />}
      </td>
      <td className="hidden px-3 py-2.5 2xl:table-cell">
        <IndustryBadge value={job.industry} />
      </td>
      <td className="max-w-40 truncate px-3 py-2.5 text-xs text-muted">{shortLocation(job)}</td>
      <td className="hidden px-3 py-2.5 2xl:table-cell">
        <WorkModeBadge value={job.work_mode} />
      </td>
      <td className="px-3 py-2.5">
        <SponsorshipBadge value={job.sponsorship} />
      </td>
      <td className="hidden px-3 py-2.5 text-xs whitespace-nowrap text-faint 2xl:table-cell" title={absTime(job.first_seen_at)}>
        {relTime(job.first_seen_at)}
      </td>
      <td className="px-3 py-2.5">
        <StatusPill value={job.application_status} />
      </td>
    </tr>
  );
}
