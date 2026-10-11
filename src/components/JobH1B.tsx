import { Link } from 'react-router-dom';
import { useJobH1B } from '../api/h1b';
import { monthSpan, wage } from '../lib/format';

const LEVEL_NOTE: Record<string, string> = { I: 'entry', II: 'mid', III: 'experienced', IV: 'senior' };

/** In the job view: the company's H-1B filings and what it offered for similar titles. */
export function JobH1B({ jobId, company, seniority }: { jobId: number; company: string; seniority?: string | null }) {
  const d = useJobH1B(jobId, seniority);
  const x = d.data;
  if (!x) return null;
  return (
    <section className="border-t border-border px-5 py-4">
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-wide text-faint uppercase">H-1B filings</h3>
      {!x.matched ? (
        <p className="text-xs text-muted">
          No H-1B applications found under {company}'s name. It may file under another legal name:{' '}
          <Link to="/sponsorship" className="text-accent hover:underline">look it up</Link>.
        </p>
      ) : (
        <div className="space-y-3 text-xs">
          <p className="leading-relaxed text-muted">
            <span className="font-medium text-text">{company}</span> filed{' '}
            <span className="font-mono text-text">{x.filings.toLocaleString()}</span> certified applications ({x.new_hires.toLocaleString()} for new hires),
            median offered wage <span className="font-mono text-text">{wage(x.wage_median)}</span>.
          </p>
          {x.similar.length > 0 ? (
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[11px] text-muted">
                  For titles like this one{x.level ? ` at wage level ${x.level}${LEVEL_NOTE[x.level] ? ` (${LEVEL_NOTE[x.level]})` : ''}` : ''}
                </span>
                {x.similar_median != null && (
                  <span className="font-mono text-text">
                    {x.similar_low !== x.similar_high ? `${wage(x.similar_low)} – ${wage(x.similar_high)}` : wage(x.similar_median)}
                  </span>
                )}
              </div>
              <ul className="space-y-1">
                {x.similar.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-text" title={`${s.title}, level ${s.level}`}>{s.title}</span>
                    <span className="shrink-0 text-faint">{s.place}</span>
                    <span className="w-24 shrink-0 text-right font-mono text-text tabular-nums">
                      {wage(s.wage_from)}{s.wage_to ? `–${wage(s.wage_to).slice(1)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-faint">No filings for titles close to this one.</p>
          )}
          <p className="text-[11px] text-faint">Department of Labor data, {monthSpan(x.period.from, x.period.to)}.</p>
        </div>
      )}
    </section>
  );
}
