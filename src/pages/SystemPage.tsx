import { useState } from 'react';
import { useCompanies, useIndustryLabel, useRuns, useStats, useUsage } from '../api/hooks';
import { CostChart, NewJobsChart, TokensChart } from '../components/Charts';
import { RunNowButton } from '../layout/AppShell';
import { StatTile } from '../components/StatTile';
import { Badge } from '../components/Badge';
import { ErrorState, Skeleton } from '../components/States';
import { money, pct, relTime, runDuration } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
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

/** Every watched company with its last fetch; searchable, failures first. */
function CompaniesCard() {
  const companies = useCompanies();
  const industryLabel = useIndustryLabel();
  const [q, setQ] = useState('');
  const [failingOnly, setFailingOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const all = companies.data?.companies ?? [];
  const failing = all.filter((c) => c.enabled && c.last_fetch_ok === false).length;
  const needle = q.trim().toLowerCase();
  const rows = all
    .filter((c) => !failingOnly || (c.enabled && c.last_fetch_ok === false))
    .filter(
      (c) =>
        !needle ||
        c.name.toLowerCase().includes(needle) ||
        c.ats.includes(needle) ||
        industryLabel(c.industry).toLowerCase().includes(needle),
    )
    .sort(
      (a, b) =>
        Number(b.last_fetch_ok === false) - Number(a.last_fetch_ok === false) ||
        b.jobs_open - a.jobs_open,
    );
  const visible = showAll || needle ? rows : rows.slice(0, 25);

  return (
    <Card title={`Companies (${all.length})`}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, ATS or industry…"
          aria-label="Search companies"
          className="w-64 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text placeholder:text-faint hover:border-accent/40"
        />
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={failingOnly}
            onChange={(e) => setFailingOnly(e.target.checked)}
            className="accent-accent"
          />
          Only failing ({failing})
        </label>
      </div>
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
                <th className="py-2 pr-3">Industry</th>
                <th className="py-2 pr-3">Enabled</th>
                <th className="py-2 pr-3">Last fetch</th>
                <th className="py-2 pr-3">Open</th>
                <th className="py-2 pr-3">Your matches</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c: Company) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-medium text-text">{c.name}</td>
                  <td className="py-2 pr-3 font-mono text-muted">{c.ats}</td>
                  <td className="py-2 pr-3 text-muted">{industryLabel(c.industry)}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={c.enabled ? 'good' : 'neutral'}>{c.enabled ? 'yes' : 'off'}</Badge>
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
                  <td className="py-2 pr-3 font-mono text-text">{c.jobs_open.toLocaleString()}</td>
                  <td className="py-2 pr-3 font-mono text-faint">{c.jobs_scored}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length < rows.length && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted hover:border-accent/40 hover:text-text"
            >
              Show all {rows.length}
            </button>
          )}
          {rows.length === 0 && <p className="py-6 text-center text-xs text-faint">No companies match.</p>}
        </div>
      )}
    </Card>
  );
}

export default function SystemPage() {
  useDocumentTitle('System');
  const stats = useStats();
  const usage = useUsage();
  const runs = useRuns(10);

  const byStage = stats.data?.by_stage ?? {};
  const scored = byStage['scored'] ?? 0;
  const excluded = byStage['excluded'] ?? 0;
  const openJobs = Object.values(byStage).reduce((a, b) => a + b, 0);
  const totals = usage.data?.totals;
  const perDay = usage.data?.per_day ?? [];

  // Cost trend: sparkline of recent days + delta vs yesterday.
  const costSpark = perDay.map((d) => d.cost_usd);
  let costDelta: { text: string; tone: 'good' | 'bad' } | undefined;
  if (costSpark.length >= 2) {
    const diff = costSpark[costSpark.length - 1]! - costSpark[costSpark.length - 2]!;
    const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±';
    costDelta = {
      text: `${sign}${money(Math.abs(diff))} vs yesterday`,
      tone: diff <= 0 ? 'good' : 'bad',
    };
  }

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
        <StatTile
          label="Open jobs"
          value={openJobs}
          spark={(stats.data?.new_per_day ?? []).map((d) => d.count)}
        />
        <StatTile label="Scored" value={scored} accent />
        <StatTile label="Excluded" value={excluded} />
        <StatTile
          label="LLM cost"
          value={money(totals?.cost_usd)}
          spark={costSpark}
          delta={costDelta}
        />
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
      <Card title="Users">
        {usage.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-medium tracking-wide text-faint uppercase">
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Joined</th>
                  <th className="py-2 pr-3">Last login</th>
                  <th className="py-2 pr-3">Profile</th>
                  <th className="py-2 pr-3">Matches</th>
                  <th className="py-2 pr-3">Spend this month</th>
                </tr>
              </thead>
              <tbody>
                {(usage.data?.users ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-text">{u.name || u.email}</div>
                      {u.name && <div className="text-faint">{u.email}</div>}
                    </td>
                    <td className="py-2 pr-3 text-muted">{relTime(u.created_at)}</td>
                    <td className="py-2 pr-3 text-muted">{relTime(u.last_login_at)}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={u.has_profile ? 'good' : 'neutral'}>
                        {u.has_profile ? 'ready' : 'none'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 font-mono text-text">{u.matches}</td>
                    <td className="py-2 pr-3 font-mono">
                      <span className={u.month_spend_usd >= u.monthly_budget_usd ? 'text-bad' : 'text-text'}>
                        {money(u.month_spend_usd)}
                      </span>
                      <span className="text-faint"> / {money(u.monthly_budget_usd)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
      <CompaniesCard />
    </div>
  );
}

