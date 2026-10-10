import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut, Play, RefreshCw, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLogout, useMe } from '../api/auth';
import { useNav } from './nav';
import { CommandPalette } from '../components/CommandPalette';
import {
  useHealth,
  useLatestRun,
  useTriggerRun,
} from '../api/hooks';
import { relTime } from '../lib/format';
import { toast } from '../lib/toast';

function UserMenu() {
  const me = useMe();
  const logout = useLogout();
  const user = me.data;
  if (!user) return null;
  return (
    <div className="flex items-center gap-2 border-t border-border px-3 py-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
        {(user.name || user.email).slice(0, 1).toUpperCase()}
      </span>
      <NavLink to="/profile" className="min-w-0 flex-1 hover:opacity-80" title="Your profile">
        <div className="truncate text-xs font-medium text-text">{user.name || user.email}</div>
        {user.name && <div className="truncate text-[11px] text-faint">{user.email}</div>}
      </NavLink>
      <button
        onClick={() => logout.mutate()}
        aria-label="Log out"
        title="Log out"
        className="rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

function Logo() {
  return (
    <span className="font-mono text-lg font-semibold tracking-tight text-text">
      wera<span className="text-accent">.</span>
    </span>
  );
}

function HealthDot({ pulse = false }: { pulse?: boolean }) {
  const health = useHealth();
  return (
    <span
      className={clsx(
        'inline-block size-2 rounded-full',
        pulse && 'animate-pulse',
        health.data ? 'bg-good' : health.isError ? 'bg-bad' : 'bg-warn',
      )}
      title={
        pulse
          ? 'Run in flight'
          : health.data
            ? 'API healthy'
            : health.isError
              ? 'API unreachable'
              : 'checking…'
      }
      aria-label={health.data ? 'API healthy' : 'API unreachable'}
    />
  );
}

export function RunNowButton() {
  const trigger = useTriggerRun();
  const latest = useLatestRun();
  const running = latest.data?.runs[0]?.status == null;
  return (
    <button
      disabled={running || trigger.isPending}
      onClick={() => trigger.mutate()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-colors duration-150 hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {running || trigger.isPending ? (
        <RefreshCw className="size-3.5 animate-spin" />
      ) : (
        <Play className="size-3.5" />
      )}
      {running ? 'Running…' : 'Run now'}
    </button>
  );
}

function TopBarMeta() {
  const latest = useLatestRun();
  const run = latest.data?.runs[0];
  return (
    <span className="hidden items-center gap-2 text-xs text-muted sm:flex">
      {run && (
        <span title={run.started_at}>
          Last run {relTime(run.started_at)}
        </span>
      )}
    </span>
  );
}

export function AppShell() {
  const qc = useQueryClient();
  const nav = useNav();
  const isAdmin = useMe().data?.is_admin ?? false;
  const latest = useLatestRun();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const running = latest.data?.runs[0]?.status == null;

  // ⌘K / Ctrl+K toggles the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // When a run we saw in flight finishes, refresh everything once.
  const seenRunning = useRef<number | null>(null);
  useEffect(() => {
    const run = latest.data?.runs[0];
    if (!run) return;
    if (run.status == null) {
      seenRunning.current = run.id;
      return;
    }
    if (seenRunning.current === run.id) {
      seenRunning.current = null;
      toast.success('Run finished — refreshing');
      void qc.invalidateQueries();
    }
  }, [latest.data, qc]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-border px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive ? 'text-accent' : 'text-muted hover:bg-surface-2 hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-accent" />
                  )}
                  <Icon className="size-4" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <UserMenu />
        <div className="flex items-center gap-2 border-t border-border px-5 py-3 text-[11px] text-faint">
          <HealthDot />
          <span>api</span>
          <span className="ml-auto font-mono">v0.1</span>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            <span className="lg:hidden">
              <Logo />
            </span>
            {/* Mobile nav */}
            <nav className="flex flex-1 items-center gap-1 lg:hidden">
              {nav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  aria-label={label}
                  className={({ isActive }) =>
                    clsx(
                      'rounded-lg p-2 transition-colors duration-150',
                      isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-2',
                    )
                  }
                >
                  <Icon className="size-4" />
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
                title="Search jobs and actions (⌘K)"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-muted transition-colors duration-150 hover:border-accent/40 hover:text-text"
              >
                <Search className="size-3.5" />
                <span className="hidden font-mono text-[11px] sm:inline">⌘K</span>
              </button>
              <TopBarMeta />
              <HealthDot pulse={running} />
              {isAdmin && <RunNowButton />}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-6 md:py-6">
          <div key={location.pathname} className="route-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
