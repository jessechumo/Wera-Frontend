import clsx from 'clsx';
import type { ReactNode } from 'react';

/** Label + big mono number + optional sub-line. */
export function StatTile({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'rounded-card border border-border bg-surface p-4 transition-colors duration-150',
        accent && 'border-accent/30',
        className,
      )}
    >
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-text">{value}</div>
      {sub != null && <div className="mt-1 text-xs text-faint">{sub}</div>}
    </div>
  );
}
