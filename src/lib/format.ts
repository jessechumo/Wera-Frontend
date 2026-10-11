export type Verdict = 'strong' | 'good' | 'stretch' | 'poor';

export function verdictOf(score: number | null): Verdict {
  if (score == null) return 'poor';
  if (score >= 80) return 'strong';
  if (score >= 65) return 'good';
  if (score >= 45) return 'stretch';
  return 'poor';
}

// Verdict palette: the ember accent marks the best fits; everything below
// desaturates toward zinc so score color signals quality without shouting.
export const verdictHex: Record<Verdict, string> = {
  strong: 'var(--color-accent)',
  good: 'var(--color-accent-2)',
  stretch: 'var(--color-muted)',
  poor: 'var(--color-faint)',
};

export const verdictColor: Record<Verdict, string> = {
  strong: 'text-accent',
  good: 'text-accent-2',
  stretch: 'text-muted',
  poor: 'text-faint',
};

export const verdictLabel: Record<Verdict, string> = {
  strong: 'Strong fit',
  good: 'Good fit',
  stretch: 'Stretch',
  poor: 'Poor fit',
};

/** Relative time: "3h ago". Clamps future timestamps to "just now". */
export function relTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.round(d / 30)}mo ago`;
}

/** Absolute date for title tooltips, in the browser's local time zone. */
export function absTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

/** Minutes from now until iso, rounded down; negative means "due". */
export function minutesUntil(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.floor((new Date(iso).getTime() - Date.now()) / 60_000);
}

/** Money with up to 4 significant digits for tiny values: $0.000341. */
export function money(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n === 0) return '$0';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  const s = Number(n.toPrecision(4)).toString();
  return `$${s}`;
}

/** A yearly wage, rounded: $163k, $1.2M. */
export function wage(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  return `$${Math.round(n / 1000)}k`;
}

/** "Jul 2025 – Jun 2026" for a span of dates. */
export function monthSpan(from: string | null | undefined, to: string | null | undefined): string {
  const f = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return from && to ? `${f(from)} – ${f(to)}` : '';
}

/** Compact numbers: 712.3k, 1.2M. */
export function compact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

/** Percent with one decimal: 88.7%. */
export function pct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}%`;
}

/** Run duration between started_at and finished_at: "2.4s" or "1m 12s". */
export function runDuration(started: string, finished: string | null): string {
  if (!finished) return '…';
  const sec = (new Date(finished).getTime() - new Date(started).getTime()) / 1_000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const m = Math.floor(sec / 60);
  return `${m}m ${Math.round(sec % 60)}s`;
}

const REASONS: Record<string, string> = {
  'title:no_category': 'Not one of your roles',
  'title:senior': 'Senior title',
  'title:sr': 'Senior title',
  'title:staff': 'Staff title',
  'title:principal': 'Principal title',
  'title:lead': 'Lead title',
  'title:manager': 'Manager title',
  'title:director': 'Director title',
  'title:head_of': 'Head of … title',
  'title:vp': 'VP title',
  'title:intern': 'Internship',
  'title:internship': 'Internship',
  'title:iii': 'Level III title',
  'location:non_us': 'Non-US location',
  'sponsorship:explicit_no': 'Sponsorship explicitly refused',
  'llm:sponsorship_no': 'No sponsorship (AI read)',
  'llm:senior': 'Senior role (AI read)',
  'llm:non_us': 'Outside the US (AI read)',
};

/** Human-readable exclude reason label. */
export function prettyReason(reason: string): string {
  if (reason.startsWith('llm:years>')) return `Needs more than ${reason.slice('llm:years>'.length)} years`;
  if (REASONS[reason]) return REASONS[reason]!;
  // Any other seniority word the title filter matched, e.g. title:engineering_manager.
  if (reason.startsWith('title:')) return `${capitalize(reason.slice(6).replace(/_/g, ' '))} title`;
  return reason;
}

/**
 * Short "New York, NY" from a possibly longer location summary: the first
 * of several locations, without a trailing "(onsite …)" remark (the work
 * mode is shown separately), plus "+N" when there were more.
 */
export function shortLocation(job: { location_summary: string | null; location_raw: string | null }): string {
  const loc = job.location_summary ?? job.location_raw;
  if (!loc) return '—';
  const parts = loc
    .split(/;|\||\n/)
    .map((p) => p.replace(/\s*\([^)]*\)?\s*$/, '').trim())
    .filter(Boolean);
  if (parts.length === 0) return '—';
  return parts.length > 1 ? `${parts[0]} +${parts.length - 1}` : parts[0]!;
}

/** "entry" -> "Entry". */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The id dir steps away from current in ids, or null at either end. */
export function stepId(ids: number[], current: number, dir: -1 | 1): number | null {
  const i = ids.indexOf(current);
  if (i < 0) return null;
  return ids[i + dir] ?? null;
}
