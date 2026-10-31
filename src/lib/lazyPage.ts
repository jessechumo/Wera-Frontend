import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** A page loaded on first visit; preload() fetches its code ahead of time. */
export type LazyPage<P> = LazyExoticComponent<ComponentType<P>> & { preload: () => Promise<unknown> };

const STALE = /dynamically imported module|importing a module script failed|error loading dynamically imported module|failed to fetch|chunkloaderror|loading chunk|unable to preload/i;

/** Whether an error is a page's code that is gone: a deploy replaced it while this tab ran the old app. */
export function isStaleChunk(e: unknown): boolean {
  return STALE.test(e instanceof Error ? `${e.name} ${e.message}` : String(e));
}

const RELOADED = 'wera-reloaded-at';

/**
 * Reloads the app once to pick up the new deploy. Not again within a
 * minute, so a real outage (the files are missing for everyone) shows
 * its error instead of reloading forever. False when it did not reload.
 */
export function reloadForNewVersion(): boolean {
  if (navigator.onLine === false) return false; // a reload now would only load the browser's error page
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(RELOADED)) || 0;
  } catch {
    // Storage blocked: reload anyway, the guard below still holds for this page.
  }
  if (Date.now() - last < 60_000) return false;
  try {
    sessionStorage.setItem(RELOADED, String(Date.now()));
  } catch {
    // ignore
  }
  window.location.reload();
  return true;
}

const backOnline = () => new Promise<void>((resolve) => window.addEventListener('online', () => resolve(), { once: true }));

/**
 * Loads a page's code. Offline, it waits for the network; when a deploy
 * removed the file, it reloads into the new version instead of failing.
 */
export async function loadFresh<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (e) {
    if (!isStaleChunk(e)) throw e;
    if (navigator.onLine === false) {
      await backOnline();
      return loadFresh(load);
    }
    if (reloadForNewVersion()) return new Promise<T>(() => {}); // the page is reloading
    throw e;
  }
}

export function lazyPage<P>(load: () => Promise<{ default: ComponentType<P> }>): LazyPage<P> {
  const page = lazy(() => loadFresh(load)) as LazyPage<P>;
  // Warming up in the background never reloads; the visit itself will.
  page.preload = load;
  return page;
}
