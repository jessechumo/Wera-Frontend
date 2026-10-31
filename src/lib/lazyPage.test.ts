import { afterEach, describe, expect, it, vi } from 'vitest';
import { isStaleChunk, loadFresh, reloadForNewVersion } from './lazyPage';

describe('pages after a deploy', () => {
  const reload = vi.fn();
  afterEach(() => {
    sessionStorage.clear();
    reload.mockReset();
    vi.unstubAllGlobals();
  });
  const stubReload = () => vi.stubGlobal('location', { ...window.location, reload });

  it('tells a missing page file from other errors', () => {
    expect(isStaleChunk(new TypeError('Failed to fetch dynamically imported module: http://x/assets/TrackerPage-BDZ.js'))).toBe(true);
    expect(isStaleChunk(new Error('Importing a module script failed.'))).toBe(true);
    expect(isStaleChunk(new Error("Cannot read properties of undefined (reading 'map')"))).toBe(false);
  });

  it('reloads once into the new version, then lets a real outage show its error', async () => {
    stubReload();
    const gone = () => Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/SettingsPage-old.js'));
    const pending = loadFresh(gone);
    await Promise.resolve();
    expect(reload).toHaveBeenCalledOnce();
    void pending; // never settles: the page is reloading
    // Still missing right after the reload: the error shows, no loop.
    await expect(loadFresh(gone)).rejects.toThrow(/dynamically imported module/);
    expect(reload).toHaveBeenCalledOnce();
    expect(reloadForNewVersion()).toBe(false);
  });

  it('waits for the network instead of reloading into the browser error page', async () => {
    stubReload();
    vi.stubGlobal('navigator', { onLine: false });
    let tries = 0;
    const page = loadFresh(() => {
      tries++;
      return tries === 1
        ? Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/SettingsPage.js'))
        : Promise.resolve({ default: 'the page' });
    });
    await new Promise((done) => setTimeout(done));
    expect(reload).not.toHaveBeenCalled();
    vi.stubGlobal('navigator', { onLine: true });
    window.dispatchEvent(new Event('online'));
    await expect(page).resolves.toEqual({ default: 'the page' });
    expect(reload).not.toHaveBeenCalled();
  });

  it('passes other errors and good loads through', async () => {
    stubReload();
    await expect(loadFresh(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(loadFresh(() => Promise.resolve({ default: 1 }))).resolves.toEqual({ default: 1 });
    expect(reload).not.toHaveBeenCalled();
  });
});
