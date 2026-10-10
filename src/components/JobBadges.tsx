import { Badge, type BadgeVariant } from './Badge';
import { useIndustryLabel } from '../api/hooks';
import { useFamilyLabel } from '../api/profile';
import type { AppStatus, Job } from '../api/types';

export function SponsorshipBadge({ value }: { value: Job['sponsorship'] }) {
  if (!value) return null;
  if (value === 'yes') return <Badge variant="good">Sponsors: yes</Badge>;
  if (value === 'no') return <Badge variant="bad">No sponsorship</Badge>;
  // "Unknown" is the common case — keep it quiet instead of warning-yellow.
  return <Badge>Sponsorship unknown</Badge>;
}

export function WorkModeBadge({ value }: { value: Job['work_mode'] }) {
  if (!value) return null;
  const label = value === 'remote' ? 'Remote' : value === 'hybrid' ? 'Hybrid' : 'Onsite';
  return <Badge>{label}</Badge>;
}

export function IndustryBadge({ value }: { value: string }) {
  const label = useIndustryLabel();
  return <Badge variant="accent-2">{label(value)}</Badge>;
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
  const label = useFamilyLabel();
  if (cats.length === 0) return null;
  const labels = [...new Set(cats.map(label))];
  return (
    <div className={className}>
      {labels.map((c) => (
        <span
          key={c}
          className="mr-1 mb-1 inline-block rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted"
        >
          {c}
        </span>
      ))}
    </div>
  );
}
