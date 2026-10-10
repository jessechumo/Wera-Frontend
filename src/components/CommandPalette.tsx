import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  BadgeCheck,
  Briefcase,
  CornerDownLeft,
  Globe,
  ListChecks,
  Play,
  Search,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../api/client';
import { useTriggerRun } from '../api/hooks';
import { useMe } from '../api/auth';
import { useNav } from '../layout/nav';
import type { JobList } from '../api/types';

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  group: 'Go to' | 'Actions' | 'Jobs';
  icon: LucideIcon;
  run: () => void;
}


function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-faint">
      {children}
    </kbd>
  );
}

/**
 * ⌘K command palette: jump to pages, apply filter presets, trigger a run,
 * or deep-link into a job. Mounted only while open, so state resets each time.
 */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const trigger = useTriggerRun();
  const navItems = useNav();
  const isAdmin = useMe().data?.is_admin ?? false;
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scored jobs for search — one fetch, filtered client-side.
  const jobs = useQuery({
    queryKey: ['jobs', 'palette'],
    queryFn: () => api<JobList>('/api/jobs?limit=200&sort=score'),
  });

  // Focus + scroll lock on open.
  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const nav: PaletteItem[] = navItems.map((n) => ({
      id: `nav-${n.to}`,
      label: n.label,
      group: 'Go to',
      icon: n.icon,
      run: () => navigate(n.to),
    }));
    const runNow: PaletteItem = {
      id: 'run',
      label: 'Run the pipeline now',
      hint: 'worker',
      group: 'Actions',
      icon: Play,
      run: () => trigger.mutate(),
    };
    const actions: PaletteItem[] = [
      ...(isAdmin ? [runNow] : []),
      {
        id: 'strong',
        label: 'Strong fits (80+)',
        hint: 'filter',
        group: 'Actions',
        icon: Zap,
        run: () => navigate('/jobs?min_score=80'),
      },
      {
        id: 'sponsor',
        label: 'Sponsorship: yes',
        hint: 'filter',
        group: 'Actions',
        icon: BadgeCheck,
        run: () => navigate('/jobs?sponsorship=yes'),
      },
      {
        id: 'remote',
        label: 'Remote only',
        hint: 'filter',
        group: 'Actions',
        icon: Globe,
        run: () => navigate('/jobs?work_mode=remote'),
      },
      {
        id: 'applied',
        label: 'Applied jobs',
        hint: 'filter',
        group: 'Actions',
        icon: ListChecks,
        run: () => navigate('/jobs?status=applied'),
      },
    ];
    const jobItems: PaletteItem[] = (jobs.data?.jobs ?? []).map((j) => ({
      id: `job-${j.id}`,
      label: j.title,
      hint: `${j.company}${j.fit_score != null ? ` · ${j.fit_score}` : ''}`,
      group: 'Jobs',
      icon: Briefcase,
      run: () => navigate(`/jobs?job=${j.id}`),
    }));
    if (!q) return [...nav, ...actions, ...jobItems.slice(0, 5)];
    return [...nav, ...actions, ...jobItems]
      .filter((it) => it.label.toLowerCase().includes(q) || it.hint?.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, jobs.data, navigate, trigger, navItems, isAdmin]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[sel];
      if (it) {
        onClose();
        it.run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="fade-enter absolute inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="anim-rise absolute left-1/2 top-24 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-card border border-border bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search jobs, jump to a page, run the pipeline…"
            aria-label="Command palette input"
            className="h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-faint"
          />
          <Kbd>esc</Kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-faint">No matches</p>
          )}
          {items.map((it, i) => (
            <Fragment key={it.id}>
              {items[i - 1]?.group !== it.group && (
                <div className="px-2.5 pt-2 pb-1 font-mono text-[10px] tracking-wide text-faint uppercase">
                  {it.group}
                </div>
              )}
              <button
                onClick={() => {
                  onClose();
                  it.run();
                }}
                onMouseEnter={() => setSel(i)}
                className={clsx(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-100',
                  i === sel ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface-2',
                )}
              >
                <it.icon
                  className={clsx('size-4 shrink-0', i === sel ? 'text-accent' : 'text-faint')}
                />
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {it.hint && (
                  <span className="shrink-0 font-mono text-[11px] text-faint">{it.hint}</span>
                )}
              </button>
            </Fragment>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-faint">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>
              <CornerDownLeft className="size-3" />
            </Kbd>{' '}
            open
          </span>
          <span className="ml-auto font-mono">{jobs.data?.jobs.length ?? 0} jobs indexed</span>
        </div>
      </div>
    </div>
  );
}
