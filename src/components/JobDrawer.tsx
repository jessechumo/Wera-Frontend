import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  Ban,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  ExternalLink,
  FileText,
  MapPin,
  PenLine,
  X,
} from 'lucide-react';
import { useHideCompany, useJob, useScoreJob, useUpdateApplication } from '../api/hooks';
import { CoverLetterPanel } from './CoverLetterPanel';
import { JobResumePanel } from './JobResumePanel';
import { toast } from '../lib/toast';
import type { AppStatus, JobDetail } from '../api/types';
import { Description } from './Description';
import { IndustryBadge, StatusPill } from './JobBadges';
import { Skeleton } from './States';
import { Insights } from './JobInsights';
import { absTime, relTime } from '../lib/format';
import { handOffJob } from '../lib/extension';

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-faint">
      {children}
    </kbd>
  );
}

function Tabs({ tab, setTab }: { tab: 'posting' | 'letter' | 'resume'; setTab: (t: 'posting' | 'letter' | 'resume') => void }) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 border-b border-border">
      {(
        [
          ['posting', 'The posting'],
          ['letter', 'Cover letter'],
          ['resume', 'Resume'],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          role="tab"
          aria-selected={tab === key}
          onClick={() => setTab(key)}
          className={clsx(
            '-mb-px border-b-2 px-3 py-2 text-xs font-medium transition-colors duration-150',
            tab === key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Right column: the fit analysis, facts, and the user's application. */
function Header({ job }: { job: JobDetail }) {
  const location = job.location_summary ?? job.location_raw;
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <IndustryBadge value={job.industry} />
        <StatusPill value={job.application_status} />
      </div>
      <h2 className="mt-2 text-xl leading-snug font-semibold text-balance text-text md:text-2xl">{job.title}</h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="size-3.5 text-faint" />
          <span className="font-medium text-text">{job.company}</span>
          {job.department && <span className="text-faint">· {job.department}</span>}
        </span>
        {location && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-faint" />
            <span className="truncate" title={location}>
              {location}
            </span>
          </span>
        )}
        {job.posted_at && (
          <span className="inline-flex items-center gap-1.5" title={absTime(job.posted_at)}>
            <CalendarDays className="size-3.5 text-faint" /> Posted {relTime(job.posted_at)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Full job detail: a wide two-column panel (the posting on the left, the
 * fit analysis and the user's application on the right) that becomes a
 * full-screen sheet on phones. onNavigate, when given, moves to the
 * previous/next job of the list it was opened from.
 */
export function JobDrawer({
  jobId,
  onClose,
  onNavigate,
}: {
  jobId: number;
  onClose: () => void;
  onNavigate?: (dir: -1 | 1) => void;
}) {
  const { data: job, isLoading, error } = useJob(jobId);
  const update = useUpdateApplication();
  const score = useScoreJob();

  // An unscored job gets its AI score the moment it is opened.
  const requested = useRef(new Set<number>());
  useEffect(() => {
    if (job && job.fit_score == null && job.stage === 'pending_score' && !requested.current.has(job.id)) {
      requested.current.add(job.id);
      score.mutate(job.id);
    }
  }, [job, score]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollers = useRef<(HTMLElement | null)[]>([]);

  // New job: back to the top of both columns.
  useEffect(() => scrollers.current.forEach((el) => el?.scrollTo({ top: 0 })), [jobId]);

  // Esc closes, o opens the posting, arrows move through the list.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, select');
      if (e.key === 'Escape') onClose();
      if (typing) return;
      if (e.key === 'o' && job?.url) {
        e.preventDefault();
        handOffJob(job.id, job.url);
        window.open(job.url, '_blank', 'noopener');
      }
      if (onNavigate && (e.key === 'ArrowRight' || e.key === 'j')) onNavigate(1);
      if (onNavigate && (e.key === 'ArrowLeft' || e.key === 'k')) onNavigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate, job?.id, job?.url]);

  // Scroll lock and initial focus while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const setStatus = (status: AppStatus) =>
    job && update.mutate({ id: job.id, status, notes: job.application_notes ?? '' });
  const [tab, setTab] = useState<'posting' | 'letter' | 'resume'>('posting');
  const [tabJob, setTabJob] = useState(jobId);
  if (tabJob !== jobId) {
    // A different job opens on its posting.
    setTabJob(jobId);
    setTab('posting');
  }
  const hide = useHideCompany();
  const hideCompany = () => {
    if (!job) return;
    hide.mutate(
      { id: job.company_id, hidden: true },
      {
        onSuccess: () => {
          toast.success(`${job.company} hidden. Unhide it in Settings.`);
          onClose();
        },
      },
    );
  };
  const saved = job?.application_status === 'saved';

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center md:p-5 lg:p-8">
      <div className="fade-enter absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={job ? `${job.title} at ${job.company}` : 'Job detail'}
        className="modal-enter relative flex w-full max-w-6xl flex-col overflow-hidden border-border bg-surface shadow-2xl md:rounded-2xl md:border"
      >
        {/* Top bar: header + actions */}
        <div className="flex shrink-0 items-start gap-4 border-b border-border px-5 py-4 md:px-6">
          {job ? (
            <Header job={job} />
          ) : (
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {job && (
              <button
                onClick={hideCompany}
                aria-label={`Hide ${job.company}`}
                title={`Hide all ${job.company} jobs`}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <EyeOff className="size-4" />
              </button>
            )}
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate(-1)}
                  aria-label="Previous job"
                  title="Previous (←)"
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => onNavigate(1)}
                  aria-label="Next job"
                  title="Next (→)"
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            )}
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              title="Close (Esc)"
              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Body: posting | insights (stacked on phones, insights first) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:grid md:grid-cols-[minmax(0,1fr)_360px] md:overflow-hidden lg:grid-cols-[minmax(0,1fr)_400px]">
          <div
            ref={(el) => {
              scrollers.current[0] = el;
            }}
            className="order-2 px-5 py-5 md:order-1 md:overflow-y-auto md:px-8 md:py-6"
          >
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className={clsx('h-3', i % 3 === 2 ? 'w-2/3' : 'w-full')} />
                ))}
              </div>
            ) : error ? (
              <p className="text-xs text-bad">
                Couldn't load this job: {error instanceof Error ? error.message : 'network error'}
              </p>
            ) : job && tab === 'resume' ? (
              <>
                <Tabs tab={tab} setTab={setTab} />
                <JobResumePanel job={job} />
              </>
            ) : job && tab === 'letter' ? (
              <>
                <Tabs tab={tab} setTab={setTab} />
                <CoverLetterPanel job={job} />
              </>
            ) : job?.description ? (
              <>
                <Tabs tab={tab} setTab={setTab} />
                <Description text={job.description} />
              </>
            ) : job ? (
              <p className="text-sm text-muted">
                This board didn't include a description. Read it on the{' '}
                <a href={job.url} data-wera-job={job.id} target="_blank" rel="noreferrer" className="text-accent-2 hover:underline">
                  original posting
                </a>
                .
              </p>
            ) : null}
          </div>
          <aside
            ref={(el) => {
              scrollers.current[1] = el;
            }}
            className="order-1 border-border bg-surface-2/35 md:order-2 md:overflow-y-auto md:border-l"
          >
            {job ? (
              <Insights key={job.id} job={job} scoring={score.isPending && score.variables === job.id} />
            ) : isLoading ? (
              <Skeleton className="m-5 h-40" />
            ) : null}
          </aside>
        </div>

        {/* Action bar */}
        {job && (
          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-surface px-5 py-3 md:px-6">
            <a
              href={job.url}
              data-wera-job={job.id}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-bg transition-colors duration-150 hover:bg-accent/85"
            >
              <ExternalLink className="size-3.5" /> Apply on {job.company}'s site
            </a>
            <button
              onClick={() => setStatus('saved')}
              disabled={saved}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-text transition-colors duration-150 hover:border-accent/40 hover:text-accent disabled:cursor-default disabled:border-accent/30 disabled:text-accent"
            >
              {saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => setTab(tab === 'letter' ? 'posting' : 'letter')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-text transition-colors duration-150 hover:border-accent/40 hover:text-accent"
            >
              {tab === 'letter' ? <FileText className="size-3.5" /> : <PenLine className="size-3.5" />}
              {tab === 'letter' ? 'Back to posting' : 'Cover letter'}
            </button>
            <button
              onClick={() => setStatus('not_interested')}
              disabled={job.application_status === 'not_interested'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-muted transition-colors duration-150 hover:border-bad/40 hover:text-bad disabled:cursor-default disabled:opacity-50"
            >
              <Ban className="size-3.5" /> Not interested
            </button>
            <span className="ml-auto hidden items-center gap-2 text-[10px] text-faint lg:flex">
              <Kbd>o</Kbd> open
              {onNavigate && (
                <>
                  · <Kbd>←</Kbd>
                  <Kbd>→</Kbd> browse
                </>
              )}
              · <Kbd>esc</Kbd> close
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}
