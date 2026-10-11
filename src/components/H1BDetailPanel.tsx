import { useH1BDetail, type H1BCount } from '../api/h1b';
import { compact, monthSpan, wage } from '../lib/format';

const LEVEL: Record<string, string> = { I: 'Entry', II: 'Qualified', III: 'Experienced', IV: 'Fully competent' };

/** A wage range drawn on a shared scale, with the median marked. */
function WageRange({ c, max }: { c: H1BCount; max: number }) {
  const lo = c.min_wage ?? c.median_wage ?? 0;
  const hi = c.max_wage ?? c.median_wage ?? 0;
  const at = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div className="relative h-1.5 w-full rounded-full bg-surface-2" title={`${wage(lo)} to ${wage(hi)}, median ${wage(c.median_wage)}`}>
      <div className="absolute inset-y-0 rounded-full bg-accent/30" style={{ left: at(lo), width: `calc(${at(hi)} - ${at(lo)})` }} />
      {c.median_wage != null && <div className="absolute -top-0.5 h-2.5 w-0.5 rounded-full bg-accent" style={{ left: at(c.median_wage) }} />}
    </div>
  );
}

function Breakdown({ title, rows, label }: { title: string; rows: H1BCount[]; label?: (s: string) => string }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.max_wage ?? r.median_wage ?? 0), 1);
  return (
    <div>
      <h4 className="mb-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase">{title}</h4>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_3rem_4rem_6rem] items-center gap-3 text-xs">
            <span className="truncate text-text" title={r.label}>{label ? label(r.label) : r.label}</span>
            <span className="text-right font-mono text-muted tabular-nums">{compact(r.filings)}</span>
            <span className="text-right font-mono text-text tabular-nums">{wage(r.median_wage)}</span>
            <WageRange c={r} max={max} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** What an employer filed: totals, then titles, places and wage levels with pay. */
export function H1BDetailPanel({ target }: { target: { companyId: number } | { key: string } }) {
  const d = useH1BDetail(target);
  if (d.isLoading) return <div className="skeleton h-40 w-full" />;
  if (d.error || !d.data) return <p className="text-xs text-muted">No H-1B filings found.</p>;
  const x = d.data;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <div><div className="font-mono text-lg text-text tabular-nums">{x.filings.toLocaleString()}</div><div className="text-faint">certified applications</div></div>
        <div><div className="font-mono text-lg text-text tabular-nums">{x.new_hires.toLocaleString()}</div><div className="text-faint">for new hires</div></div>
        <div><div className="font-mono text-lg text-text tabular-nums">{wage(x.wage_median)}</div><div className="text-faint">median offered wage</div></div>
        <div><div className="font-mono text-lg text-text tabular-nums">{wage(x.wage_p25)} – {wage(x.wage_p75)}</div><div className="text-faint">middle half</div></div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_3rem_4rem_6rem] gap-3 text-[10px] font-medium tracking-wide text-faint uppercase">
        <span /><span className="text-right">Filed</span><span className="text-right">Median</span><span>Range</span>
      </div>
      <Breakdown title="Job titles" rows={x.titles} />
      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown title="Where" rows={x.places} />
        <Breakdown title="Wage level" rows={x.levels} label={(l) => `${l} · ${LEVEL[l] ?? ''}`} />
      </div>
      <p className="text-[11px] leading-relaxed text-faint">
        Filed as {x.names.join(', ')}. Certified Labor Condition Applications, {monthSpan(x.period.from, x.period.to)}, from the
        US Department of Labor. A filing shows intent to hire or keep someone on H-1B, not that a visa was approved.
      </p>
    </div>
  );
}
