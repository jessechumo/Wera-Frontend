import { Wand2 } from 'lucide-react';
import { useAutofillRuns } from '../api/extension';
import { relTime } from '../lib/format';
import { useExtension } from '../lib/extension';

/**
 * Applications the Chrome extension filled for this job: where, how many
 * pages and fields. With the extension installed and none yet, a hint
 * that opening the posting lets it fill the application.
 */
export function AutofillHistory({ jobId }: { jobId: number }) {
  const runs = useAutofillRuns(jobId);
  const ext = useExtension();
  const list = runs.data?.runs ?? [];
  if (!list.length && !ext) return null;
  return (
    <section className="border-t border-border px-5 py-4 md:px-6">
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
        <Wand2 className="size-3.5 text-accent" /> Autofill
      </h3>
      {list.length ? (
        <ul className="mt-2 space-y-1.5">
          {list.slice(0, 5).map((r) => (
            <li key={r.id} className="text-xs text-muted">
              <span className="font-medium text-text">{r.host}</span>
              {' · '}{r.pages} page{r.pages === 1 ? '' : 's'}, {r.filled} field{r.filled === 1 ? '' : 's'} filled
              {r.suggested > 0 && ` (${r.suggested} by AI)`}
              <span className="text-faint"> · {relTime(r.updated_at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-xs text-muted">Open the posting and use the Wera button: the extension lists every field, fills what you approve and continues page by page. It never submits.</p>
      )}
    </section>
  );
}
