import { useCompanies, useRuns, useStats, useUsage } from '../api/hooks';
import { CostChart, NewJobsChart, TokensChart } from '../components/Charts';
import { RunNowButton } from '../layout/AppShell';
import { StatTile } from '../components/StatTile';
import { Badge } from '../components/Badge';
import { ErrorState, Skeleton } from '../components/States';
import { groupLabel, money, pct, relTime, runDuration } from '../lib/format';
import type { Company } from '../api/types';
import clsx from 'clsx';

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx('rounded-card border border-border bg-surface p-4', className)}>
      <h3 className="mb-3 text-sm font-semibold text-text">{title}</h3>
      {children}
    </section>
  );
}

function statusBadge(status: string | null) {
  if (status === 'ok') return <Badge variant="good">ok</Badge>;
  if (status === 'partial') return <Badge variant="warn">partial</Badge>;
  if (status === 'failed') return <Badge variant="bad">failed</Badge>;
  return <Badge variant="accent">running</Badge>;
}

export default function SystemPage() {
  const stats = useStats();
  const usage = useUsage();
  const runs = useRuns(10);
  const companies = useCompanies();

  const byStage = stats.data?.by_stage ?? {};
  const scored = byStage['scored'] ?? 0;
  const excluded = byStage['excluded'] ?? 0;
  const openJobs = Object.values(byStage).reduce((a, b) => a + b, 0);
  const totals = usage.data?.totals;
  const perDay = usage.data?.per_day ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">System</h1>
          <p className="mt-1 text-xs text-muted">
            Pipeline health and Coral Bricks usage across recent runs.
          </p>
        </div>
        <RunNowButton />
      </header>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Open jobs" value={openJobs} />
        <StatTile label="Scored" value={scored} accent />
        <StatTile label="Excluded" value={excluded} />
        <StatTile label="LLM cost" value={money(totals?.cost_usd)} />
        <StatTile
          label="Cost / scored job"
          value={scored > 0 && totals ? money(totals.cost_usd / scored) : '—'}
        />
        <StatTile label="Cache hit" value={pct(totals?.cached_percent)} />
      </div>
      <p className="-mt-2 text-right font-mono text-[10px] text-faint">
        Powered by Coral Bricks · glm-5.3-flash-fast
      </p>

      {/* Charts */}
      <div className="grid gap-3 xl:grid-cols-2">
        <Card title="New jobs per day (14 days)">
          {stats.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <NewJobsChart data={stats.data?.new_per_day ?? []} />
          )}
        </Card>
        <Card title="Tokens per day">
          {usage.isLoading ? <Skeleton className="h-56 w-full" /> : <TokensChart data={perDay} />}
        </Card>
        <Card title="Cost per day" className="xl:col-span-2">
          {usage.isLoading ? <Skeleton className="h-56 w-full" /> : <CostChart data={perDay} />}
        </Card>
      </div>

      {/* Runs */}
      <Card title="Recent runs">
        {runs.error ? (
          <ErrorState message={String(runs.error)} />
        ) : runs.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-medium tracking-wide text-faint uppercase">
                  <th className="py-2 pr-3">Started</th>
                  <th className="py-2 pr-3">Duration</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Companies</th>
                  <th className="py-2 pr-3">New</th>
                  <th className="py-2 pr-3">Excluded</th>
                  <th className="py-2 pr-3">Scored</th>
                  <th className="py-2 pr-3">Cost</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {(runs.data?.runs ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-muted" title={r.started_at}>
                      {relTime(r.started_at)}
                    </td>
                    <td className="py-2 pr-3 text-muted">
                      {runDuration(r.started_at, r.finished_at)}
                    </td>
                    <td className="py-2 pr-3">{statusBadge(r.status)}</td>
                    <td className="py-2 pr-3 text-muted">
                      <span className="text-good">{r.companies_ok}</span>
                      <span className="text-faint">/</span>
                      <span className={r.companies_failed > 0 ? 'text-bad' : 'text-faint'}>
                        {r.companies_failed}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-text">{r.jobs_new}</td>
                    <td className="py-2 pr-3 text-faint">{r.jobs_excluded}</td>
                    <td className="py-2 pr-3 text-text">{r.jobs_scored}</td>
                    <td className="py-2 pr-3 text-muted">{money(r.cost_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Companies */}
      <Card title="Companies">
        {companies.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : companies.error ? (
          <ErrorState message={String(companies.error)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-medium tracking-wide text-faint uppercase">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">ATS</th>
                  <th className="py-2 pr-3">Group</th>
                  <th className="py-2 pr-3">Enabled</th>
                  <th className="py-2 pr-3">Last fetch</th>
                  <th className="py-2 pr-3">Open</th>
                  <th className="py-2 pr-3">Scored</th>
                </tr>
              </thead>
              <tbody>
                {(companies.data?.companies ?? []).map((c: Company) => (
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-text">{c.name}</td>
                    <td className="py-2 pr-3 font-mono text-muted">{c.ats}</td>
                    <td className="py-2 pr-3 text-muted">{groupLabel(c.group)}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={c.enabled ? 'good' : 'neutral'}>
                        {c.enabled ? 'yes' : 'off'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={clsx(
                            'inline-block size-1.5 rounded-full',
                            c.last_fetch_ok === true
                              ? 'bg-good'
                              : c.last_fetch_ok === false
                                ? 'bg-bad'
                                : 'bg-faint',
                          )}
                        />
                        <span className="text-muted" title={c.last_fetch_at ?? ''}>
                          {relTime(c.last_fetch_at)}
                        </span>
                        {c.last_fetch_error && (
                          <span className="cursor-help text-bad/80" title={c.last_fetch_error}>
                            ⚠
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-text">{c.jobs_open}</td>
                    <td className="py-2 pr-3 font-mono text-faint">{c.jobs_scored}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

