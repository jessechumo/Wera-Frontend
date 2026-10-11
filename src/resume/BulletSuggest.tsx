import { useEffect, useState } from 'react';
import { LoaderCircle, Sparkles, X } from 'lucide-react';
import { ApiError } from '../api/client';
import { suggestBullet } from '../api/resumes';

/** "[X]%" style placeholders, highlighted so they get filled in. */
export function Placeholders({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]{1,20}\])/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\[[^\]]+\]$/.test(p) ? (
          <mark key={i} className="rounded bg-warn/20 px-0.5 text-warn">{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/** AI rewrites of one bullet, applied with a click. */
export function BulletSuggest({ text, role, jobId, onPick, onClose }: {
  text: string; role: string; jobId?: number | null; onPick: (t: string) => void; onClose: () => void;
}) {
  const [state, setState] = useState<{ loading: boolean; items: string[]; error: string }>({ loading: true, items: [], error: '' });
  // Asked once, for the bullet as it was when the panel opened.
  useEffect(() => {
    let live = true;
    suggestBullet(text, role, jobId)
      .then((r) => live && setState({ loading: false, items: r.suggestions, error: '' }))
      .catch((e) => live && setState({ loading: false, items: [], error: e instanceof ApiError ? e.message : 'Could not get suggestions' }));
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on open
  return (
    <div className="anim-rise mt-1 ml-4 rounded-lg border border-accent/25 bg-accent/[0.05] p-2" role="region" aria-label="Suggested rewrites">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-accent">
        <Sparkles className="size-3" /> Stronger versions
        <button type="button" onClick={onClose} aria-label="Close suggestions" className="ml-auto rounded p-0.5 text-faint hover:text-text"><X className="size-3" /></button>
      </div>
      {state.loading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted"><LoaderCircle className="size-3.5 animate-spin" /> Writing three options…</div>
      ) : state.error ? (
        <p className="text-xs text-bad">{state.error}</p>
      ) : (
        <ul className="space-y-1">
          {state.items.map((s, i) => (
            <li key={i}>
              <button type="button" onClick={() => onPick(s)}
                className="w-full rounded-md px-2 py-1.5 text-left text-[13px] leading-snug text-text hover:bg-surface">
                <Placeholders text={s} />
              </button>
            </li>
          ))}
          <li className="px-2 pt-0.5 text-[10px] text-faint">Fill in anything in [brackets] with your real numbers, or delete it.</li>
        </ul>
      )}
    </div>
  );
}
