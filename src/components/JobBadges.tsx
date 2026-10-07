import { Badge, type BadgeVariant } from './Badge';
import { groupLabel } from '../lib/format';
import type { AppStatus, Job } from '../api/types';

export function SponsorshipBadge({ value }: { value: Job['sponsorship'] }) {
  if (!value) return null;
  if (value === 'yes') return <Badge variant="good">Sponsors: yes</Badge>;
  return <Badge variant="warn">Sponsorship unknown</Badge>;
}

export function WorkModeBadge({ value }: { value: Job['work_mode'] }) {
  if (!value) return null;
  const label = value === 'remote' ? 'Remote' : value === 'hybrid' ? 'Hybrid' : 'Onsite';
  return <Badge>{label}</Badge>;
}

export function GroupBadge({ value }: { value: string }) {
  return (
    <Badge variant={value === 'trading' ? 'accent' : 'accent-2'}>{groupLabel(value)}</Badge>
  );
}

const STATUS_META: Record<AppStatus, { variant: BadgeVariant; label: string }> = {
  saved: { variant: 'accent', label: 'Saved' },
  applied: { variant: 'accent-2', label: 'Applied' },
  interviewing: { variant: 'warn', label: 'Interviewing' },
  offer: { variant: 'good', label: 'Offer' },
  rejected: { variant: 'bad', label: 'Rejected' },
  not_interested: { variant: 'neutral', label: 'Not interested' },
};

export function StatusPill({ value }: { value: AppStatus | null }) {
  if (!value) return null;
  const meta = STATUS_META[value];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function CategoryChips({ cats, className }: { cats: string[]; className?: string }) {
  if (cats.length === 0) return null;
  return (
    <div className={className}>
      {cats.map((c) => (
        <span
          key={c}
          className="mr-1 inline-block rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-faint"
        >
          {c}
        </span>
      ))}
    </div>
  );
}
