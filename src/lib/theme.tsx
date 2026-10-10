import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Monitor, Moon, Sun } from 'lucide-react';

export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'wera-theme';
const ORDER: ThemePref[] = ['system', 'light', 'dark'];

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // storage blocked: fall back to the system theme
  }
  return 'system';
}

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Sets data-theme on <html>; index.html does the same before first paint. */
function apply(pref: ThemePref) {
  const resolved = pref === 'system' ? systemTheme() : pref;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.background = ''; // drop the pre-paint color
}

const listeners = new Set<(p: ThemePref) => void>();

/** The saved theme preference, shared by every toggle on the page. */
export function useTheme(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(readPref);
  useEffect(() => {
    listeners.add(setPref);
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onSystem = () => readPref() === 'system' && apply('system');
    mq.addEventListener('change', onSystem);
    return () => {
      listeners.delete(setPref);
      mq.removeEventListener('change', onSystem);
    };
  }, []);
  const set = (p: ThemePref) => {
    try {
      localStorage.setItem(KEY, p);
    } catch {
      // not persisted; still applies for this page
    }
    apply(p);
    listeners.forEach((l) => l(p));
  };
  return [pref, set];
}

const ICON = { system: Monitor, light: Sun, dark: Moon };
const LABEL = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };

/** Cycles system → light → dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const [pref, setPref] = useTheme();
  const Icon = ICON[pref];
  const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length]!;
  return (
    <button
      type="button"
      onClick={() => setPref(next)}
      aria-label={`${LABEL[pref]} (switch to ${LABEL[next].toLowerCase()})`}
      title={`${LABEL[pref]} · click for ${LABEL[next].toLowerCase()}`}
      className={clsx(
        'rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text',
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
