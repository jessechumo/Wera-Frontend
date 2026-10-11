import { Fragment, useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Building2, ChevronDown, Info, Search } from 'lucide-react';
import { useIndustryLabel } from '../api/hooks';
import { useH1BEmployers } from '../api/h1b';
import { useSponsorship, type SponsorSignal, type SponsorshipStat } from '../api/sponsorship';
import { H1BDetailPanel } from '../components/H1BDetailPanel';
import { StatTile } from '../components/StatTile';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
import { compact, monthSpan, wage } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const SIGNAL: Record<SponsorSignal, { label: string; cls: string }> = {
  sponsors: { label: 'Sponsors', cls: 'bg-good/10 text-good border-good/30' },
  mixed: { label: 'Depends on role', cls: 'bg-warn/10 text-warn border-warn/30' },
  does_not_sponsor: { label: 'Does not sponsor', cls: 'bg-bad/10 text-bad border-bad/30' },
  unclear: { label: 'Not stated', cls: 'bg-surface-2 text-muted border-border' },
};

function Bar({ s }: { s: SponsorshipStat }) {
  const total = s.yes + s.no + s.unknown || 1;
  return (
    <div className="flex h-1.5 w-20 overflow-hidden rounded-full bg-surface-2" aria-label={`${s.yes} yes, ${s.no} no, ${s.unknown} not stated`}>
      <div className="bg-good" style={{ width: `${(s.yes / total) * 100}%` }} />
      <div className="bg-bad" style={{ width: `${(s.no / total) * 100}%` }} />
    </div>
  );
}

/** Search every employer in the filings, including companies Wera does not watch. */
function EmployerLookup() {
  const [q, setQ] = useState('');
  const query = useDeferredValue(q.trim());
  const found = useH1BEmployers(query);
  const [open, setOpen] = useState<string | null>(null);
  const list = found.data?.employers ?? [];
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Building2 className="size-4 text-accent" />
        <h2 className="text-sm font-semibold">Look up any employer</h2>
      </div>
      <p className="mt-0.5 text-xs text-muted">Every employer in the filings, including companies Wera does not watch.</p>
      <label className="relative mt-3 block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Google, Deloitte, Mayo Clinic…" aria-label="Employer name"
          className="w-full rounded-lg border border-border bg-surface-2/50 py-2 pr-3 pl-9 text-sm text-text placeholder:text-faint focus:border-accent/60 focus:outline-none" />
      </label>
      {query.length >= 2 && (
        <div className="mt-2 divide-y divide-border">
          {found.isLoading ? <SkeletonRows rows={3} /> : !list.length ? <p className="py-3 text-xs text-muted">No employer by that name filed in this period.</p> : list.map((e) => (
            <div key={e.key}>
              <button onClick={() => setOpen(open === e.key ? null : e.key)} aria-expanded={open === e.key}
                className="flex w-full items-center gap-3 py-2.5 text-left text-sm hover:text-accent">
                <span className="min-w-0 flex-1 truncate font-medium">{e.name}</span>
                <span className="font-mono text-xs text-muted tabular-nums">{compact(e.filings)} filed</span>
                <span className="w-14 text-right font-mono text-xs text-text tabular-nums">{wage(e.median_wage)}</span>
                <ChevronDown className={clsx('size-4 text-faint transition-transform', open === e.key && 'rotate-180')} />
              </button>
              {open === e.key && <div className="pb-4"><H1BDetailPanel target={{ key: e.key }} /></div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function SponsorshipPage() {
  useDocumentTitle('Sponsorship');
  const [q, setQ] = useState('');
  const [filersOnly, setFilersOnly] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const query = useDeferredValue(q.trim());
  const data = useSponsorship(query);
  const industryLabel = useIndustryLabel();
  const all = data.data?.companies ?? [];
  const rows = filersOnly ? all.filter((r) => (r.h1b_filings ?? 0) > 0) : all;
  const count = (sig: SponsorSignal) => all.filter((r) => r.signal === sig).length;
  const filers = all.filter((r) => (r.h1b_filings ?? 0) > 0).length;
  const period = monthSpan(data.data?.h1b_period?.from, data.data?.h1b_period?.to);

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <header>
        <h1 className="text-[28px] leading-tight font-semibold">Sponsorship</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Who files for H-1B workers, what they pay, and what each company's own postings say about sponsorship.
        </p>
      </header>

      <div className="flex items-start gap-2.5 rounded-card border border-accent/25 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        <span>
          H-1B figures are certified Labor Condition Applications{period && ` (${period})`} from the US Department of Labor: the
          employer's filing before hiring or extending someone on an H-1B, with the job title and offered wage. Posting signals come
          from job text, so "not stated" is common and does not mean no.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="File H-1Bs" value={filers} />
        <StatTile label="Postings say sponsor" value={count('sponsors')} />
        <StatTile label="Depends on role" value={count('mixed')} />
        <StatTile label="Postings say no" value={count('does_not_sponsor')} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies Wera watches" aria-label="Search companies"
            className="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm text-text placeholder:text-faint focus:border-accent/60 focus:outline-none" />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={filersOnly} onChange={(e) => setFilersOnly(e.target.checked)} className="accent-accent" />
          Only companies that file H-1Bs
        </label>
      </div>

      {data.isLoading ? (
        <SkeletonRows rows={6} />
      ) : data.error ? (
        <ErrorState message={String(data.error)} onRetry={() => void data.refetch()} />
      ) : !rows.length ? (
        <EmptyState title={query ? `No sponsorship data for “${query}”` : 'No sponsorship data yet'} hint="Try the employer lookup below." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[11px] font-semibold tracking-wide text-faint uppercase">
              <tr>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5 text-right">H-1B filed</th>
                <th className="hidden px-4 py-2.5 text-right sm:table-cell">Median wage</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Postings say</th>
                <th className="hidden px-4 py-2.5 xl:table-cell">What a posting says</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((s) => {
                const files = (s.h1b_filings ?? 0) > 0;
                const isOpen = open === s.company_id;
                return (
                  <Fragment key={s.company_id}>
                    <tr onClick={() => files && setOpen(isOpen ? null : s.company_id)}
                      className={clsx('transition-colors', files && 'cursor-pointer hover:bg-surface-2/50', isOpen && 'bg-surface-2/40')}>
                      <td className="px-4 py-3">
                        <Link to={`/jobs?q=${encodeURIComponent(s.company)}`} onClick={(e) => e.stopPropagation()} className="font-medium text-text hover:text-accent">
                          {s.company}
                        </Link>
                        <div className="text-xs text-faint">{industryLabel(s.industry)} · {s.open_jobs} open</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {files ? (
                          <>
                            <div className="font-mono text-text tabular-nums">{s.h1b_filings!.toLocaleString()}</div>
                            <div className="text-[11px] text-faint">{compact(s.h1b_new_hires)} new hires</div>
                          </>
                        ) : (
                          <span className="text-xs text-faint" title="No filings found under this company's name">none found</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-text tabular-nums sm:table-cell">{files ? wage(s.h1b_median_wage) : ''}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {s.analyzed > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className={clsx('inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', SIGNAL[s.signal].cls)}>
                              {SIGNAL[s.signal].label}
                            </span>
                            <Bar s={s} />
                          </div>
                        ) : (
                          <span className="text-xs text-faint">not read yet</span>
                        )}
                      </td>
                      <td className="hidden max-w-xs px-4 py-3 xl:table-cell">
                        {s.latest_quote ? <span className="line-clamp-2 text-xs text-muted italic">“{s.latest_quote}”</span> : <span className="text-xs text-faint">—</span>}
                      </td>
                      <td className="pr-3">
                        {files && <ChevronDown className={clsx('size-4 text-faint transition-transform', isOpen && 'rotate-180')} aria-label={isOpen ? 'Hide filings' : 'Show filings'} />}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="bg-surface-2/20 px-4 py-4"><H1BDetailPanel target={{ companyId: s.company_id }} /></td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EmployerLookup />
    </div>
  );
}
