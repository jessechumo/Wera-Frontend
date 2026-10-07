import { useEffect, useRef, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { useJob, useUpdateApplication } from '../api/hooks';
import type { AppStatus, DeepAnalysis, JobDetail } from '../api/types';
import { ScoreRing } from './ScoreRing';
import { Badge } from './Badge';
import { CategoryChips, SponsorshipBadge, StatusPill, WorkModeBadge } from './JobBadges';
import { StatusSelect } from './StatusSelect';
import { Skeleton } from './States';
import {
  absTime,
  compact,
  money,
  relTime,
  runDuration,
  verdictLabel,
  verdictOf,
} from '../lib/format';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-5 py-4">
      <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-faint uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/50 px-3 py-2">
      <div className="text-[10px] font-medium tracking-wide text-faint uppercase">{label}</div>
      <div className="mt-0.5 text-xs font-medium text-text">{children}</div>
    </div>
  );
}

function DeepSection({ deep }: { deep: DeepAnalysis }) {
  return (
    <Section title="Deep review">
      <div className="flex items-start gap-3">
        <ScoreRing score={deep.fit_score} size="sm" />
        <p className="text-xs leading-relaxed text-muted">{deep.reason}</p>
      </div>
      <div className="mt-4 space-y-4">
        {deep.raw.why_fit.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-good">Why I fit</div>
            <ul className="space-y-1.5">
              {deep.raw.why_fit.map((w, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-good" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
        {deep.raw.resume_bullets.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-accent-2">
              Resume bullets to emphasize
            </div>
            <ul className="space-y-1.5">
              {deep.raw.resume_bullets.map((w, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent-2" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
        {deep.raw.gaps.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-warn">
              Gaps &amp; how to address them
            </div>
            <ul className="space-y-2.5">
              {deep.raw.gaps.map((g, i) => (
                <li key={i} className="rounded-lg border border-warn/15 bg-warn/5 p-2.5">
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
    </Section>
  );
}

function DrawerBody({ job }: { job: JobDetail }) {
  const update = useUpdateApplication();
  // notes state: null means "untouched, mirror the server".
  const [notes, setNotes] = useState<string | null>(null);
  useEffect(() => {
    setNotes(null);
  }, [job.id]);

  const currentNotes = notes ?? job.application_notes ?? '';

  const setStatus = (status: AppStatus) => {
    update.mutate({ id: job.id, status, notes: currentNotes });
  };
  const saveNotes = () => {
    if (notes == null) return; // nothing changed
    update.mutate({ id: job.id, status: job.application_status ?? 'saved', notes });
  };

  const verdict = verdictOf(job.fit_score);

  return (
    <div className="min-h-full">
      {/* 1. Header */}
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl leading-snug font-semibold text-text">{job.title}</h2>
            <div className="mt-1 text-sm text-muted">
              {job.company}
              {job.department ? ` · ${job.department}` : ''}
            </div>
          </div>
          <StatusPill value={job.application_status} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-bg transition-colors duration-150 hover:bg-accent/85"
          >
            <ExternalLink className="size-3.5" /> Open posting
          </a>
          <span className="font-mono text-[11px] text-faint">{job.source}</span>
        </div>
      </div>

      {/* 2. Score + reason */}
      {job.fit_score != null && (
        <div className="flex items-center gap-4 border-t border-border px-5 py-4">
          <ScoreRing score={job.fit_score} size="lg" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text">{verdictLabel[verdict]}</div>
            {job.reason && <p className="mt-1 text-xs leading-relaxed text-muted">{job.reason}</p>}
          </div>
        </div>
      )}

      {/* 3. Facts grid */}
      <Section title="Facts">
        <div className="grid grid-cols-2 gap-2">
          <Fact label="Seniority">{job.seniority ?? '—'}</Fact>
          <Fact label="Years required">
            {job.years_required != null ? String(job.years_required) : '—'}
          </Fact>
          <Fact label="Work mode">
            <WorkModeBadge value={job.work_mode} />
          </Fact>
          <Fact label="Sponsorship">
            <SponsorshipBadge value={job.sponsorship} />
          </Fact>
          <Fact label="Location">{job.location_summary ?? job.location_raw ?? '—'}</Fact>
          <Fact label="Posted">
            <span title={absTime(job.posted_at)}>{job.posted_at ? relTime(job.posted_at) : '—'}</span>
          </Fact>
          <Fact label="First seen">
            <span title={absTime(job.first_seen_at)}>{relTime(job.first_seen_at)}</span>
          </Fact>
          <Fact label="Categories">
            <CategoryChips cats={job.matched_categories} />
          </Fact>
        </div>
      </Section>

      {/* 4. Skills */}
      {(job.skills_matched?.length ?? 0) + (job.skills_missing?.length ?? 0) > 0 && (
        <Section title="Skills">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {(job.skills_matched ?? []).map((s) => (
                <Badge key={s} variant="good">
                  {s}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(job.skills_missing ?? []).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* 5. Deep review */}
      {job.deep ? <DeepSection deep={job.deep} /> : null}

      {/* 6. My application */}
      <Section title="My application">
        <StatusSelect value={job.application_status} onChange={setStatus} className="max-w-52" />
        <textarea
          value={currentNotes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          placeholder="Notes — saved automatically when you click away…"
          aria-label="Application notes"
          className="mt-2.5 w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs leading-relaxed text-text placeholder:text-faint transition-colors duration-150 hover:border-accent/40"
        />
      </Section>

      {/* 7. Description lives on the posting; the API does not carry it. */}
      <Section title="Description">
        <p className="text-xs leading-relaxed text-muted">
          The full description lives at the{' '}
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-accent-2 underline-offset-2 hover:underline"
          >
            original posting
          </a>
          .
        </p>
      </Section>

      {/* 8. Analysis footer meta */}
      <footer className="border-t border-border px-5 py-3">
        {job.deep ? (
          <div className="font-mono text-[10px] leading-relaxed text-faint">
            deep · {job.deep.model} · in {compact(job.deep.prompt_tokens)} (
            {compact(job.deep.cached_tokens)} cached) · out {compact(job.deep.completion_tokens)} ·{' '}
            {money(job.deep.cost_usd)} · {runDuration(
              job.deep.created_at,
              new Date(new Date(job.deep.created_at).getTime() + job.deep.latency_ms).toISOString(),
            )}
          </div>
        ) : (
          <div className="font-mono text-[10px] text-faint">
            job #{job.id} · {job.source}/{job.ext_id}
          </div>
        )}
      </footer>
    </div>
  );
}

/** Right-side slide-over with the full job detail. */
export function JobDrawer({ jobId, onClose }: { jobId: number; onClose: () => void }) {
  const { data: job, isLoading, error } = useJob(jobId);
  const closeRef = useRef<HTMLButtonElement>(null);

  // ESC to close, scroll lock while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fade-enter absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="drawer-enter absolute inset-y-0 right-0 flex w-[560px] max-w-full flex-col border-l border-border bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Job detail"
      >
        <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
          <span className="font-mono text-xs text-faint">job #{jobId}</span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close detail"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-accent/40 hover:text-text"
          >
            <X className="size-3.5" /> Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 p-5">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="p-5 text-xs text-bad">
              Couldn't load this job: {error instanceof Error ? error.message : 'network error'}
            </div>
          ) : job ? (
            <DrawerBody job={job} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

