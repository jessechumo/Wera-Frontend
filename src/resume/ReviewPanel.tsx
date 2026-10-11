import clsx from 'clsx';
import { ArrowRight, CheckCircle2, CircleAlert, Lightbulb, Wrench } from 'lucide-react';
import type { Review, ReviewCheck } from '../api/resumes';

const GROUPS: { severity: ReviewCheck['severity']; title: string; icon: typeof Wrench; cls: string }[] = [
  { severity: 'fix', title: 'Fix', icon: Wrench, cls: 'text-bad' },
  { severity: 'improve', title: 'Improve', icon: CircleAlert, cls: 'text-warn' },
  { severity: 'tip', title: 'Tips', icon: Lightbulb, cls: 'text-muted' },
];

function scoreLabel(score: number) {
  if (score >= 90) return { label: 'Strong', cls: 'text-good' };
  if (score >= 75) return { label: 'Good', cls: 'text-good' };
  if (score >= 60) return { label: 'Needs work', cls: 'text-warn' };
  return { label: 'Weak', cls: 'text-bad' };
}

/** A small ring with the review score, for the toolbar. */
export function ScoreBadge({ score, onClick }: { score: number; onClick?: () => void }) {
  const { label, cls } = scoreLabel(score);
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <button type="button" onClick={onClick} title={`Resume review: ${score}/100 (${label})`} aria-label={`Resume review: ${score} out of 100, ${label}`}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium hover:bg-surface-2">
      <svg viewBox="0 0 24 24" className={clsx('size-6 -rotate-90', cls)} aria-hidden>
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" />
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <span className="font-mono tabular-nums">{score}</span>
      <span className={clsx('hidden sm:inline', cls)}>{label}</span>
    </button>
  );
}

/** The resume review: what to fix, improve or consider, each linked to its place. */
export function ReviewPanel({ review, onJump, onFit }: { review: Review | null; onJump: (target: string) => void; onFit?: () => void }) {
  if (!review) return <div className="skeleton h-64 w-full" />;
  const { label, cls } = scoreLabel(review.score);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-card border border-border bg-surface p-4">
        <div className={clsx('font-mono text-4xl font-semibold tabular-nums', cls)}>{review.score}</div>
        <div>
          <div className={clsx('text-sm font-semibold', cls)}>{label}</div>
          <p className="text-xs text-muted">
            Checks recruiters and applicant tracking systems care about: contact details, strong openers, numbers, length and consistency.
          </p>
        </div>
      </div>
      {review.checks.length === 0 ? (
        <p className="flex items-center gap-2 rounded-card border border-good/30 bg-good/5 p-4 text-sm text-good">
          <CheckCircle2 className="size-4" /> Nothing to fix. Tailor a copy to each job for the last mile.
        </p>
      ) : (
        GROUPS.map((g) => {
          const items = review.checks.filter((c) => c.severity === g.severity);
          if (!items.length) return null;
          return (
            <section key={g.severity}>
              <h3 className={clsx('mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase', g.cls)}>
                <g.icon className="size-3.5" /> {g.title} <span className="font-mono text-faint">{items.length}</span>
              </h3>
              <ul className="divide-y divide-border rounded-card border border-border bg-surface">
                {items.map((c, i) => (
                  <li key={i}>
                    {c.target ? (
                      <button type="button" onClick={() => onJump(c.target!)} className="group flex w-full items-start gap-2 px-3 py-2 text-left text-xs hover:bg-surface-2/60">
                        <span className="flex-1 text-text">{c.message}</span>
                        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-faint group-hover:text-accent" aria-label="Show me" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs">
                        <span className="flex-1 text-text">{c.message}</span>
                        {c.id === 'too-long' && onFit && (
                          <button type="button" onClick={onFit} className="shrink-0 rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-bg hover:bg-accent/85">Fit now</button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
