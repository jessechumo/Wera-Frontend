import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, Briefcase, ExternalLink } from 'lucide-react';
import { useCompanies, useIndustries, useJobs } from '../api/hooks';
import type { Company } from '../api/types';
import { JobCard } from '../components/JobCard';
import { JobDrawer } from '../components/JobDrawer';
import { JobRow } from '../components/JobRow';
import { StatTile } from '../components/StatTile';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '../components/States';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** Public careers page for a company's job board. */
function boardURL(c: Company): string {
  switch (c.ats) {
    case 'greenhouse':
      return `https://job-boards.greenhouse.io/${c.token}`;
    case 'lever':
      return `https://jobs.lever.co/${c.token}`;
    default:
      return `https://jobs.ashbyhq.com/${c.token}`;
  }
}

function Matches({ industry, onOpen }: { industry: string; onOpen: (id: number) => void }) {
  // Scored matches only (min_score 1), the same set the match count covers.
  const jobs = useJobs({ industry, min_score: 1, limit: 100, sort: 'score' });
  if (jobs.isLoading) return <SkeletonRows rows={5} />;
  if (jobs.error) return <ErrorState message={String(jobs.error)} onRetry={() => void jobs.refetch()} />;
  const list = jobs.data?.jobs ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="size-5 text-faint" />}
        title="No matches in this industry yet"
        hint="None of its open jobs fit your roles and levels so far. Check its companies below, or widen your roles on the Profile page."
      />
    );
  }
  return (
    <>
      <div className="hidden overflow-x-auto rounded-card border border-border bg-surface sm:block">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-medium tracking-wide text-faint uppercase">
              <th className="w-14 px-3 py-2.5">Score</th>
              <th className="px-3 py-2.5">Title</th>
              <th className="px-3 py-2.5">Company</th>
              <th className="px-3 py-2.5">Industry</th>
              <th className="px-3 py-2.5">Location</th>
              <th className="px-3 py-2.5">Mode</th>
              <th className="px-3 py-2.5">Sponsorship</th>
              <th className="px-3 py-2.5">First seen</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((job, i) => (
              <JobRow key={job.id} job={job} index={i} onOpen={onOpen} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2.5 sm:hidden">
        {list.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} onOpen={onOpen} quickActions={false} />
        ))}
      </div>
    </>
  );
}

function Companies({ industry }: { industry: string }) {
  const companies = useCompanies();
  if (companies.isLoading) return <Skeleton className="h-40 w-full" />;
  if (companies.error) return <ErrorState message={String(companies.error)} />;
  const list = (companies.data?.companies ?? [])
    .filter((c) => c.industry === industry && c.enabled)
    .sort((a, b) => b.jobs_scored - a.jobs_scored || b.jobs_open - a.jobs_open);
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((c) => (
        <a
          key={c.id}
          href={boardURL(c)}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors duration-150 hover:border-accent/40"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text">{c.name}</div>
            <div className="text-[11px] text-faint">
              {c.jobs_open} open
              {c.jobs_scored > 0 && (
                <>
                  {' · '}
                  <span className="text-accent">{c.jobs_scored} for you</span>
                </>
              )}
            </div>
          </div>
          <ExternalLink className="size-3.5 shrink-0 text-faint transition-colors group-hover:text-accent" />
        </a>
      ))}
    </div>
  );
}

/** One industry: the user's matches in it and the companies Wera watches there. */
export default function IndustryPage() {
  const { id = '' } = useParams<{ id: string }>();
  const industries = useIndustries();
  const ind = industries.data?.industries.find((i) => i.id === id);
  useDocumentTitle(ind?.label ?? 'Industry');
  const [tab, setTab] = useState<'matches' | 'companies'>('matches');
  const [drawerId, setDrawerId] = useState<number | null>(null);

  if (industries.isLoading) return <Skeleton className="h-64 w-full" />;
  if (!ind) return <Navigate to="/industries" replace />;

  return (
    <div className="space-y-5">
      <header>
        <Link to="/industries" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
          <ArrowLeft className="size-3.5" /> Industries
        </Link>
        <h1 className="mt-2 text-[28px] leading-tight font-semibold">{ind.label}</h1>
        <p className="mt-1 text-xs text-muted">{ind.description}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Your matches" value={ind.matches} accent />
        <StatTile label="Best fit" value={ind.top_score ?? '—'} />
        <StatTile label="Companies" value={ind.companies} />
        <StatTile label="Open jobs" value={ind.open_jobs.toLocaleString()} />
      </div>

      <div role="tablist" className="flex gap-1 border-b border-border">
        {(
          [
            ['matches', `Your matches (${ind.matches})`],
            ['companies', `Companies (${ind.companies})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={clsx(
              '-mb-px border-b-2 px-3 py-2 text-xs font-medium transition-colors duration-150',
              tab === key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'matches' ? <Matches industry={ind.id} onOpen={setDrawerId} /> : <Companies industry={ind.id} />}

      {drawerId != null && <JobDrawer jobId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  );
}
