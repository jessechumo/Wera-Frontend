// The dashboard's side of the Wera for Chrome bridge. The extension adds
// a small script to this site (only the server its user signed in to);
// it marks the page and passes messages both ways:
//   - opening a job's posting tells the extension which job that tab is
//     for, so its side panel shows the job even when the career site's
//     address differs from the one Wera has;
//   - a change made here (status, details, letter) or there makes the
//     other side refetch.
// Without the extension these messages go nowhere.
import { useEffect, useState } from 'react';

const FROM_DASHBOARD = 'wera-dashboard';
export const FROM_EXTENSION = 'wera-extension';
const READY = 'wera-extension:ready';

/** The installed extension's version, or null. */
export function extensionVersion(): string | null {
  return document.documentElement.dataset.weraExtension ?? null;
}

export function useExtension(): string | null {
  const [version, setVersion] = useState(extensionVersion);
  useEffect(() => {
    const onReady = () => setVersion(extensionVersion());
    window.addEventListener(READY, onReady);
    return () => window.removeEventListener(READY, onReady);
  }, []);
  return version;
}

function post(data: Record<string, unknown>) {
  if (!extensionVersion()) return;
  window.postMessage({ source: FROM_DASHBOARD, ...data }, location.origin);
}

/** The user is opening this job's posting. */
export function handOffJob(jobId: number, url: string) {
  post({ type: 'open-job', jobId, url });
}

/** Something the extension shows changed here. */
export function announceChange(what = '') {
  post({ type: 'changed', what });
}
