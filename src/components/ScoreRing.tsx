import { verdictHex, verdictOf } from '../lib/format';

type Size = 'sm' | 'md' | 'lg';

const DIMS: Record<Size, { box: number; stroke: number; num: string }> = {
  sm: { box: 36, stroke: 3, num: 'text-[11px]' },
  md: { box: 52, stroke: 4, num: 'text-sm' },
  lg: { box: 88, stroke: 6, num: 'text-2xl' },
};

/** Circular score 0-100, colored by verdict. Shows an em dash when unscored. */
export function ScoreRing({ score, size = 'md' }: { score: number | null; size?: Size }) {
  const { box, stroke, num } = DIMS[size];
  const r = (box - stroke) / 2 - 2;
  const circ = 2 * Math.PI * r;
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
