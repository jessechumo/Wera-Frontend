import { verdictHex, verdictOf } from '../lib/format';

type Size = 'sm' | 'md' | 'lg';

const DIMS: Record<Size, { box: number; stroke: number; num: string }> = {
  sm: { box: 36, stroke: 3, num: 'text-[11px]' },
  md: { box: 52, stroke: 4, num: 'text-sm' },
  lg: { box: 88, stroke: 6, num: 'text-2xl' },
};

/**
 * Circular score 0-100, colored by verdict. Without a score it shows the
 * relevance estimate as a dashed, muted ring marked "est." (or an em dash
 * when there is neither).
 */
export function ScoreRing({
  score,
  estimate = null,
  size = 'md',
}: {
  score: number | null;
  estimate?: number | null;
  size?: Size;
}) {
  const { box, stroke, num } = DIMS[size];
  const r = (box - stroke) / 2 - 2;
  const circ = 2 * Math.PI * r;
  if (score == null && estimate != null) {
    return (
      <div
        className="relative shrink-0"
        style={{ width: box, height: box }}
        aria-label={`Estimated fit ${estimate}, AI score pending`}
        title="Estimated from your profile; the AI score is on its way"
      >
        <svg width={box} height={box} className="-rotate-90">
          <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={stroke} />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={r}
            fill="none"
            stroke="var(--color-faint)"
            strokeWidth={stroke}
            strokeDasharray="3 4"
            className="animate-pulse"
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className={`font-mono font-semibold text-muted ${num}`}>{estimate}</span>
          {size !== 'sm' && <span className="mt-0.5 text-[9px] tracking-wide text-faint uppercase">est.</span>}
        </span>
      </div>
    );
  }
  const color = verdictHex[verdictOf(score)];
  return (
    <div
      className="relative shrink-0"
      style={{ width: box, height: box }}
      role={score == null ? undefined : 'meter'}
      aria-valuenow={score ?? undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Fit score"
    >
      <svg width={box} height={box} className="-rotate-90">
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={stroke}
        />
        {score != null && (
          <circle
            cx={box / 2}
            cy={box / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - Math.min(Math.max(score, 0), 100) / 100)}
          />
        )}
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-mono font-semibold ${num}`}
        style={{ color }}
      >
        {score == null ? '—' : score}
      </span>
    </div>
  );
}
