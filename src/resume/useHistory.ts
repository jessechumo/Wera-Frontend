import { useCallback, useRef, useState } from 'react';

/**
 * Undo/redo for a value. Quick successive changes (typing) merge into one
 * step; a pause of `mergeMs` starts a new one.
 */
export function useHistory<T>(initial: T, mergeMs = 700) {
  const [state, setState] = useState({ past: [] as T[], present: initial, future: [] as T[] });
  const last = useRef(0);

  const set = useCallback(
    (next: T) => {
      const now = Date.now();
      const merge = now - last.current < mergeMs;
      last.current = now;
      setState((s) => ({
        past: merge ? s.past : [...s.past.slice(-99), s.present],
        present: next,
        future: [],
      }));
    },
    [mergeMs],
  );
  /** Replace the value without an undo step (e.g. adopting the server's copy). */
  const reset = useCallback((next: T) => setState({ past: [], present: next, future: [] }), []);
  const undo = useCallback(() => {
    last.current = 0;
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1]!, future: [s.present, ...s.future] } : s));
  }, []);
  const redo = useCallback(() => {
    last.current = 0;
    setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0]!, future: s.future.slice(1) } : s));
  }, []);
  return { value: state.present, set, reset, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
