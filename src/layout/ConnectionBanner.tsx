import { useEffect, useRef, useSyncExternalStore } from 'react';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { useHealth } from '../api/hooks';

const subscribe = (notify: () => void) => onlineManager.subscribe(notify);

/**
 * Says what is wrong while Wera can't be reached, and refreshes the app when
 * it can be again. Pages keep what they already show in the meantime, so a
 * tab left open through an outage carries on by itself.
 */
export function ConnectionBanner() {
  const qc = useQueryClient();
  const health = useHealth();
  const online = useSyncExternalStore(subscribe, () => onlineManager.isOnline());
  const down = online && health.isError;

  // Nothing tells a page when a server comes back, so whatever failed
  // meanwhile asks again here.
  const wasDown = useRef(false);
  useEffect(() => {
    if (wasDown.current && !down && health.isSuccess) void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'health' });
    wasDown.current = down;
  }, [down, health.isSuccess, qc]);

  if (online && !down) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b border-warn/25 bg-warn/10 px-4 py-1.5 text-xs text-text">
      <WifiOff className="size-3.5 shrink-0 text-warn" />
      <span>
        {online
          ? "Wera's server isn't answering. Your data is safe, and this page will catch up by itself when it's back."
          : "You're offline. This page will catch up by itself when you reconnect."}
      </span>
    </div>
  );
}
