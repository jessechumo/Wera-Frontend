import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Monitor, Moon, Sun } from 'lucide-react';

export type ThemePref = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const KEY = 'wera-theme';

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // storage blocked: fall back to the system theme
  }
  return 'system';
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolve(pref: ThemePref): Theme {
  return pref === 'system' ? systemTheme() : pref;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Sets data-theme on <html>; index.html does the same before first paint. */
function paint(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.background = ''; // drop the pre-paint color
}

/**
 * Switches themes gracefully: a circular reveal from the point the user
 * clicked (View Transitions API), or a short color crossfade where that is
 * unsupported. Reduced-motion users get an instant switch.
 */
function transitionTo(theme: Theme, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  if (reducedMotion()) {
    paint(theme);
    return;
  }
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };
  if (doc.startViewTransition) {
    const x = origin?.x ?? window.innerWidth - 40;
    const y = origin?.y ?? 40;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = doc.startViewTransition(() => paint(theme));
    void vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
    return;
  }
  root.classList.add('theme-fade');
  paint(theme);
  window.setTimeout(() => root.classList.remove('theme-fade'), 400);
}

const listeners = new Set<(p: ThemePref) => void>();

/** The saved preference, the theme in effect, and a setter shared by every control. */
export function useTheme(): {
  pref: ThemePref;
  theme: Theme;
  setPref: (p: ThemePref, origin?: { x: number; y: number }) => void;
} {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [theme, setTheme] = useState<Theme>(() => resolve(readPref()));
  useEffect(() => {
    const onChange = (p: ThemePref) => {
      setPrefState(p);
      setTheme(resolve(p));
    };
    listeners.add(onChange);
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onSystem = () => {
      if (readPref() === 'system') {
        transitionTo(systemTheme());
        setTheme(systemTheme());
      }
    };
    mq.addEventListener('change', onSystem);
    return () => {
      listeners.delete(onChange);
      mq.removeEventListener('change', onSystem);
    };
  }, []);
  const setPref = (p: ThemePref, origin?: { x: number; y: number }) => {
    try {
      localStorage.setItem(KEY, p);
    } catch {
      // not persisted; still applies for this page
    }
    transitionTo(resolve(p), origin);
    listeners.forEach((l) => l(p));
  };
  return { pref, theme, setPref };
}

/** Sun in light mode, moon in dark mode; click to switch. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setPref } = useTheme();
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={(e) => setPref(next, { x: e.clientX, y: e.clientY })}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={clsx(
        'relative inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-text',
        className,
      )}
    >
      <Sun
        className={clsx(
          'absolute size-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          theme === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
        )}
      />
      <Moon
        className={clsx(
          'absolute size-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0',
        )}
      />
    </button>
  );
}

const CHOICES: { pref: ThemePref; label: string; Icon: typeof Sun }[] = [
  { pref: 'light', label: 'Light', Icon: Sun },
  { pref: 'dark', label: 'Dark', Icon: Moon },
  { pref: 'system', label: 'Match system', Icon: Monitor },
];

/** Segmented light / dark / system choice (Settings). */
export function ThemeChoice() {
  const { pref, setPref } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {CHOICES.map(({ pref: p, label, Icon }) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={pref === p}
          onClick={(e) => setPref(p, { x: e.clientX, y: e.clientY })}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
            pref === p ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          <Icon className="size-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}
