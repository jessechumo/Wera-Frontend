import { useId } from 'react';
import clsx from 'clsx';
import type { ReactNode } from 'react';

/** Tiny inline sparkline; renders nothing for fewer than two points. */
export function Sparkline({
  data,
  stroke = 'var(--color-accent)',
}: {
  data: number[];
  stroke?: string;
}) {
  const id = useId();
  if (data.length < 2) return null;
  const w = 88;
  const h = 26;
  const pad = 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map(
    (v, i) =>
      `${(pad + (i / (data.length - 1)) * (w - 2 * pad)).toFixed(1)},${(
        h -
        pad -
        ((v - min) / span) * (h - 2 * pad)
      ).toFixed(1)}`,
  );
  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${pts.join(' ')} ${w - pad},${h - pad} ${pad},${h - pad}`}
        fill={`url(#${id})`}
      />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Label + big mono number + optional trend chip, sparkline and sub-line. */
export function StatTile({
  label,
  value,
  sub,
  delta,
  spark,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** Trend chip under the number, e.g. "+12 vs yesterday". */
  delta?: { text: string; tone?: 'good' | 'bad' | 'neutral' };
  /** Sparkline drawn from the series, most recent point last. */
  spark?: number[];
  accent?: boolean;
  className?: string;
}) {
  const tone = delta?.tone ?? 'neutral';
  return (
    <div
      className={clsx(
        'rounded-card border border-border bg-surface p-4 transition-colors duration-150',
        accent && 'border-accent/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted">{label}</div>
          <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-text">
            {value}
          </div>
          {sub != null && <div className="mt-1 text-xs text-faint">{sub}</div>}
          {delta && (
            <div
              className={clsx(
                'mt-1 font-mono text-[11px] tabular-nums',
                tone === 'good' && 'text-good',
                tone === 'bad' && 'text-bad',
                tone === 'neutral' && 'text-faint',
              )}
            >
              {delta.text}
            </div>
          )}
        </div>
        {spark && (
          <span className="hidden sm:block">
            <Sparkline data={spark} />
          </span>
        )}
      </div>
    </div>
  );
}
