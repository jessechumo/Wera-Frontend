import clsx from 'clsx';
import type { ReactNode } from 'react';

export type BadgeVariant = 'good' | 'warn' | 'bad' | 'neutral' | 'accent' | 'accent-2';

const styles: Record<BadgeVariant, string> = {
  good: 'border-good/25 bg-good/10 text-good',
  warn: 'border-warn/25 bg-warn/10 text-warn',
  bad: 'border-bad/25 bg-bad/10 text-bad',
  neutral: 'border-border bg-surface-2 text-muted',
  accent: 'border-accent/30 bg-accent/10 text-accent',
  'accent-2': 'border-accent-2/25 bg-accent-2/10 text-accent-2',
};

export function Badge({
  variant = 'neutral',
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
