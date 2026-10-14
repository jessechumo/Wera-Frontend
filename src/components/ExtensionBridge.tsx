import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FROM_EXTENSION, handOffJob } from '../lib/extension';

/**
 * Hands off every posting link marked with data-wera-job (left or middle
 * click), and refetches when the extension changed something.
 */
export function ExtensionBridge() {
  const qc = useQueryClient();
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.type === 'auxclick' && e.button !== 1) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-wera-job]');
      const id = Number(a?.dataset.weraJob);
      if (a && id > 0) handOffJob(id, a.href);
    };
    let timer = 0;
    const onMessage = (e: MessageEvent<{ source?: string; type?: string }>) => {
      if (e.source !== window || e.origin !== location.origin || e.data?.source !== FROM_EXTENSION || e.data.type !== 'changed') return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void qc.invalidateQueries(), 300);
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    window.addEventListener('message', onMessage);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onClick, true);
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };
  }, [qc]);
  return null;
}
