import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Info, Search } from 'lucide-react';
import { useIndustryLabel } from '../api/hooks';
import { useSponsorship, type SponsorSignal, type SponsorshipStat } from '../api/sponsorship';
import { StatTile } from '../components/StatTile';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
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
    <div className="flex h-1.5 w-28 overflow-hidden rounded-full bg-surface-2" aria-label={`${s.yes} yes, ${s.no} no, ${s.unknown} not stated`}>
      <div className="bg-good" style={{ width: `${(s.yes / total) * 100}%` }} />
      <div className="bg-bad" style={{ width: `${(s.no / total) * 100}%` }} />
    </div>
  );
}

export default function SponsorshipPage() {
  useDocumentTitle('Sponsorship');
  const [q, setQ] = useState('');
  const query = useDeferredValue(q.trim());
  const data = useSponsorship(query);
  const industryLabel = useIndustryLabel();
  const rows = data.data?.companies ?? [];
  const count = (sig: SponsorSignal) => rows.filter((r) => r.signal === sig).length;

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <header className="mb-5">
        <h1 className="text-[28px] leading-tight font-semibold">Sponsorship</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          What each company's own postings say about visa sponsorship, gathered while Wera reads jobs.
        </p>
      </header>

      <div className="mb-5 flex items-start gap-2.5 rounded-card border border-accent/25 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        <span>
          Signals come from posting text, so "not stated" is common and does not mean no. Official filing history (H-1B
          and green card disclosures by employer) is coming soon.
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Companies" value={rows.length} />
        <StatTile label="Sponsor" value={count('sponsors')} />
        <StatTile label="Depends on role" value={count('mixed')} />
        <StatTile label="Do not sponsor" value={count('does_not_sponsor')} />
      </div>

      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search companies"
          aria-label="Search companies"
          className="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-sm text-text placeholder:text-faint focus:border-accent/60 focus:outline-none"
        />
      </label>

      {data.isLoading ? (
        <SkeletonRows rows={6} />
      ) : data.error ? (
        <ErrorState message={String(data.error)} onRetry={() => void data.refetch()} />
      ) : !rows.length ? (
        <EmptyState title={query ? `No sponsorship data for “${query}” yet` : 'No sponsorship data yet'} hint="Signals appear as Wera scores postings." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-[11px] font-semibold tracking-wide text-faint uppercase">
              <tr>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Signal</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Postings read</th>
                <th className="hidden px-4 py-2.5 lg:table-cell">What a posting says</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((s) => (
                <tr key={s.company_id} className="transition-colors hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <Link to={`/jobs?q=${encodeURIComponent(s.company)}`} className="font-medium text-text hover:text-accent">
                      {s.company}
                    </Link>
                    <div className="text-xs text-faint">
                      {industryLabel(s.industry)} · {s.open_jobs} open
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', SIGNAL[s.signal].cls)}>
                      {SIGNAL[s.signal].label}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      <Bar s={s} />
                      <span className="text-xs whitespace-nowrap text-muted tabular-nums">
                        {s.yes} yes · {s.no} no · {s.unknown} unstated
                      </span>
                    </div>
                  </td>
                  <td className="hidden max-w-sm px-4 py-3 lg:table-cell">
                    {s.latest_quote ? (
                      <span className="line-clamp-2 text-xs text-muted italic">“{s.latest_quote}”</span>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
