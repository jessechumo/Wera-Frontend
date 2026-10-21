// The insights column of the job drawer: fit score and verdict, the
// job's facts, matched and missing skills, the deep review, H-1B history,
// and the user's application status and notes.
import { useState } from 'react';
import clsx from 'clsx';
import { Ban } from 'lucide-react';
import { useUpdateApplication } from '../api/hooks';
import type { AppStatus, DeepAnalysis, JobDetail } from '../api/types';
import { absTime, compact, money, prettyReason, relTime, verdictLabel, verdictOf } from '../lib/format';
import { Badge } from './Badge';
import { AddedBadge, AutofilledBadge, CategoryChips, SponsorshipBadge, WorkModeBadge } from './JobBadges';
import { JobH1B } from './JobH1B';
import { ScoreRing } from './ScoreRing';
import { StatusSelect } from './StatusSelect';

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

export function Insights({ job, scoring }: { job: JobDetail; scoring: boolean }) {
  const update = useUpdateApplication();
  const [notes, setNotes] = useState<string | null>(null); // null: mirror the server (reset per job by key)
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
      {job.stage === 'excluded' && !scoring ? (
        <div className="flex items-start gap-3 px-5 py-5">
          <span className="mt-0.5 rounded-full bg-bad/10 p-2 text-bad">
            <Ban className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text">Not a match for you</div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {job.exclude_reason ? prettyReason(job.exclude_reason) : 'Your preferences rule this job out.'}
              {job.exclude_evidence && <span className="mt-1 block text-faint">“{job.exclude_evidence}”</span>}
            </p>
          </div>
        </div>
      ) : job.fit_score == null && (scoring || job.estimated_score != null) ? (
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
            {job.source === 'manual' ? <AddedBadge source={job.source} /> : <span className="font-mono">{job.source}</span>}
            <AutofilledBadge at={job.autofilled_at} />
          </Fact>
        </div>
        {job.matched_categories.length > 0 && <CategoryChips cats={job.matched_categories} className="mt-3" />}
      </Section>

      <JobH1B jobId={job.id} company={job.company} seniority={job.seniority} />

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
