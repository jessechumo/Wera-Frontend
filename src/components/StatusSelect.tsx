import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { AppStatus } from '../api/types';

export const APP_STATUSES: { value: AppStatus; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'not_interested', label: 'Not interested' },
];

export function StatusSelect({
  value,
  onChange,
  className,
  label = 'Application status',
}: {
  value: AppStatus | null;
  onChange: (status: AppStatus) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div className={clsx('relative', className)}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as AppStatus)}
        aria-label={label}
        className="w-full appearance-none rounded-lg border border-border bg-surface-2 py-1.5 pr-7 pl-2.5 text-xs font-medium text-text transition-colors duration-150 hover:border-accent/40"
      >
        {/* Selected while null: the hidden placeholder option keeps the box subtle. */}
        <option value="" disabled hidden>
          Set status…
        </option>
        {APP_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-faint" />
    </div>
  );
}
