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
  ExternalLink,
  MapPin,
  X,
} from 'lucide-react';
import { useJob, useScoreJob, useUpdateApplication } from '../api/hooks';
import type { AppStatus, DeepAnalysis, JobDetail } from '../api/types';
import { ScoreRing } from './ScoreRing';
import { Badge } from './Badge';
import { Description } from './Description';
import {
  CategoryChips,
  IndustryBadge,
  SponsorshipBadge,
  StatusPill,
  WorkModeBadge,
} from './JobBadges';
import { StatusSelect } from './StatusSelect';
import { Skeleton } from './States';
import { absTime, compact, money, relTime, verdictLabel, verdictOf } from '../lib/format';

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-faint">
      {children}
    </kbd>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-5 py-4">
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-wide text-faint uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium tracking-wide text-faint uppercase">{label}</div>
      <div className="mt-0.5 truncate text-xs font-medium text-text">{children}</div>
    </div>
  );
}

function BulletList({ items, dot }: { items: string[]; dot: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((w, i) => (
        <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
          <span className={clsx('mt-1.5 size-1 shrink-0 rounded-full', dot)} />
          {w}
        </li>
      ))}
    </ul>
  );
}

function DeepSection({ deep }: { deep: DeepAnalysis }) {
  return (
    <Section title="Deep review">
      <p className="text-xs leading-relaxed text-muted">{deep.reason}</p>
      <div className="mt-4 space-y-4">
        {deep.raw.why_fit.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-good">Why you fit</div>
            <BulletList items={deep.raw.why_fit} dot="bg-good" />
          </div>
        )}
        {deep.raw.resume_bullets.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-accent-2">Resume bullets to lead with</div>
            <BulletList items={deep.raw.resume_bullets} dot="bg-accent-2" />
          </div>
        )}
        {deep.raw.gaps.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-warn">Gaps and how to address them</div>
            <ul className="space-y-2">
              {deep.raw.gaps.map((g, i) => (
                <li key={i} className="rounded-lg border border-warn/20 bg-warn/5 p-2.5">
                  <div className="text-xs font-medium text-text">{g.gap}</div>
                  <div className="mt-1 text-xs leading-relaxed text-muted">{g.address}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {deep.raw.interview_topics.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-accent">Interview topics</div>
            <div className="flex flex-wrap gap-1.5">
              {deep.raw.interview_topics.map((t, i) => (
                <Badge key={i} variant="accent">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 font-mono text-[10px] text-faint">
        {deep.model} · {compact(deep.prompt_tokens)} in · {money(deep.cost_usd)}
      </div>
    </Section>
  );
}

/** Right column: the fit analysis, facts, and the user's application. */
function Insights({ job, scoring }: { job: JobDetail; scoring: boolean }) {
  const update = useUpdateApplication();
  const [notes, setNotes] = useState<string | null>(null); // null: mirror the server
  useEffect(() => setNotes(null), [job.id]);
  const currentNotes = notes ?? job.application_notes ?? '';
  const setStatus = (status: AppStatus) => update.mutate({ id: job.id, status, notes: currentNotes });
  const saveNotes = () => {
    if (notes == null) return;
    update.mutate({ id: job.id, status: job.application_status ?? 'saved', notes });
  };
  const verdict = verdictOf(job.fit_score);
  const matched = job.skills_matched ?? [];
  const missing = job.skills_missing ?? [];

  return (
    <>
      {job.fit_score == null && (scoring || job.estimated_score != null) ? (
        <div className="flex items-start gap-4 px-5 py-5">
          <ScoreRing score={null} estimate={job.estimated_score} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-text">
              {scoring ? 'Scoring this job…' : 'Estimated match'}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {scoring
                ? 'Reading the posting against your profile. This takes a couple of seconds.'
                : 'Estimated from your profile. The AI score arrives with the next scoring pass.'}
            </p>
            {scoring && (
              <div className="mt-3 space-y-1.5">
                <div className="skeleton h-2.5 w-full" />
                <div className="skeleton h-2.5 w-4/5" />
              </div>
            )}
          </div>
        </div>
      ) : job.fit_score != null ? (
        <div className="flex items-start gap-4 px-5 py-5">
          <ScoreRing score={job.fit_score} size="lg" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text">{verdictLabel[verdict]}</div>
            {job.reason && <p className="mt-1 text-xs leading-relaxed text-muted">{job.reason}</p>}
          </div>
        </div>
      ) : (
        <div className="px-5 py-5 text-xs text-muted">Not scored yet: scores arrive after the next run.</div>
      )}

      <Section title="At a glance">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Fact label="Seniority">{job.seniority ?? '—'}</Fact>
          <Fact label="Years required">{job.years_required != null ? `${job.years_required}+` : '—'}</Fact>
          <Fact label="Work mode">
            <WorkModeBadge value={job.work_mode} />
            {!job.work_mode && '—'}
          </Fact>
          <Fact label="Sponsorship">
            <SponsorshipBadge value={job.sponsorship} />
            {!job.sponsorship && '—'}
          </Fact>
          <Fact label="First seen">
            <span title={absTime(job.first_seen_at)}>{relTime(job.first_seen_at)}</span>
          </Fact>
          <Fact label="Source">
            <span className="font-mono">{job.source}</span>
          </Fact>
        </div>
        {job.matched_categories.length > 0 && <CategoryChips cats={job.matched_categories} className="mt-3" />}
      </Section>

      {matched.length + missing.length > 0 && (
        <Section title="Skills">
          {matched.length > 0 && (
            <>
              <div className="mb-1.5 text-[11px] text-muted">You have</div>
              <div className="flex flex-wrap gap-1.5">
                {matched.map((s) => (
                  <Badge key={s} variant="good">
                    {s}
                  </Badge>
                ))}
              </div>
            </>
          )}
          {missing.length > 0 && (
            <>
              <div className="mt-3 mb-1.5 text-[11px] text-muted">They also want</div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </>
          )}
        </Section>
      )}

      {job.deep && <DeepSection deep={job.deep} />}

      <Section title="Your application">
        <StatusSelect value={job.application_status} onChange={setStatus} className="max-w-52" />
        <textarea
          value={currentNotes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          placeholder="Notes: referral, recruiter, follow-up date… saved when you click away"
          aria-label="Application notes"
          className="mt-2.5 w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs leading-relaxed text-text placeholder:text-faint transition-colors duration-150 hover:border-accent/40"
        />
      </Section>
    </>
  );
}

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
        window.open(job.url, '_blank', 'noopener');
      }
      if (onNavigate && (e.key === 'ArrowRight' || e.key === 'j')) onNavigate(1);
      if (onNavigate && (e.key === 'ArrowLeft' || e.key === 'k')) onNavigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate, job?.url]);

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
            ) : job?.description ? (
              <>
                <h3 className="mb-3 text-[11px] font-semibold tracking-wide text-faint uppercase">The posting</h3>
                <Description text={job.description} />
              </>
            ) : job ? (
              <p className="text-sm text-muted">
                This board didn't include a description. Read it on the{' '}
                <a href={job.url} target="_blank" rel="noreferrer" className="text-accent-2 hover:underline">
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
              <Insights job={job} scoring={score.isPending && score.variables === job.id} />
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
