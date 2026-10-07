import clsx from 'clsx';
import type { ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-card border border-border bg-surface px-4 py-3"
        >
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      {icon}
      <div className="text-sm font-medium text-text">{title}</div>
      {hint && <div className="max-w-sm text-xs leading-relaxed text-muted">{hint}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-bad/25 bg-bad/5 px-6 py-12 text-center">
      <AlertTriangle className="size-5 text-bad" />
      <div className="text-sm font-medium text-text">Something went wrong</div>
      <div className="max-w-md text-xs text-muted">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:border-accent/40"
        >
          <RotateCw className="size-3.5" /> Retry
        </button>
      )}
    </div>
  );
}
