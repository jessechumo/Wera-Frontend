import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, Factory, Star } from 'lucide-react';
import { useIndustries } from '../api/hooks';
import { useProfile } from '../api/profile';
import type { Industry } from '../api/types';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { verdictColor, verdictOf } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function IndustryCard({ ind, starred }: { ind: Industry; starred: boolean }) {
  return (
    <Link
      to={`/industries/${ind.id}`}
      className="anim-rise group flex flex-col rounded-card border border-border bg-surface p-4 transition-colors duration-150 hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-text">{ind.label}</h3>
        {starred && <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-label="Preferred" />}
      </div>
      <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted">{ind.description}</p>
      <div className="mt-4 flex items-end justify-between">
        <div className="flex gap-4 text-[11px] text-faint">
          <span>
            <span className="font-mono text-sm text-text">{ind.matches}</span> matches
          </span>
          <span>
            <span className="font-mono text-sm text-muted">{ind.companies}</span> companies
          </span>
          <span>
            <span className="font-mono text-sm text-muted">{ind.open_jobs.toLocaleString()}</span> open
          </span>
        </div>
        {ind.top_score != null ? (
          <span
            className={clsx('font-mono text-sm font-semibold', verdictColor[verdictOf(ind.top_score)])}
            title="Best fit score in this industry"
          >
            {ind.top_score}
          </span>
        ) : (
          <ArrowRight className="size-4 text-faint transition-colors group-hover:text-accent" />
        )}
      </div>
    </Link>
  );
}

/** Every industry Wera watches, with the user's matches in each. */
export default function IndustriesPage() {
  useDocumentTitle('Industries');
  const industries = useIndustries();
  const profile = useProfile();
  const preferred = new Set(profile.data?.answers?.industries ?? []);

  if (industries.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }
  if (industries.error) {
    return <ErrorState message={String(industries.error)} onRetry={() => void industries.refetch()} />;
  }
  const all = (industries.data?.industries ?? []).filter((i) => i.companies > 0);
  if (all.length === 0) {
    return <EmptyState icon={<Factory className="size-5 text-faint" />} title="No industries yet" />;
  }
  // Preferred industries first, then the rest; both A to Z so any one is easy to find.
  const az = [...all].sort((a, b) => a.label.localeCompare(b.label));
  const mine = az.filter((i) => preferred.has(i.id));
  const rest = az.filter((i) => !preferred.has(i.id));
  const totalCompanies = all.reduce((n, i) => n + i.companies, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] leading-tight font-semibold">Industries</h1>
        <p className="mt-1 text-xs text-muted">
          {totalCompanies} companies across {all.length} industries. Open one to see your matches and
          its companies.
        </p>
      </header>
      {mine.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-wide text-faint uppercase">Your industries</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mine.map((ind) => (
              <IndustryCard key={ind.id} ind={ind} starred />
            ))}
          </div>
        </section>
      )}
      <section className="space-y-3">
        {mine.length > 0 && (
          <h2 className="text-xs font-medium tracking-wide text-faint uppercase">All industries</h2>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((ind) => (
            <IndustryCard key={ind.id} ind={ind} starred={false} />
          ))}
        </div>
      </section>
    </div>
  );
}
