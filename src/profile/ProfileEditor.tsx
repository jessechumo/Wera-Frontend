import { LoaderCircle, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { INPUT_CLS } from '../auth/AuthPage';

/** The profile text the AI scores jobs against, with an AI draft button. */
export function ProfileEditor({
  value,
  onChange,
  onDraft,
  drafting,
  draftError,
}: {
  value: string;
  onChange: (v: string) => void;
  onDraft: () => void;
  drafting: boolean;
  draftError: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          Every job is scored against this text. Check it and fix anything the AI got wrong.
        </p>
        <button
          type="button"
          onClick={onDraft}
          disabled={drafting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent-2/40 bg-accent-2/10 px-3 py-1.5 text-xs font-medium text-accent-2 transition-colors duration-150 hover:bg-accent-2/20 disabled:opacity-60"
        >
          {drafting ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {drafting ? 'Writing…' : value ? 'Redraft with AI' : 'Draft with AI'}
        </button>
      </div>
      {draftError && (
        <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-xs text-bad">
          {draftError}
        </p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={22}
        spellCheck
        aria-label="Profile text"
        placeholder={'# Candidate Profile\n\n## Target roles\n…'}
        className={clsx(INPUT_CLS, 'font-mono text-xs leading-relaxed', drafting && 'opacity-50')}
      />
      <div className="text-right text-[11px] text-faint">{value.length.toLocaleString()} / 12,000</div>
    </div>
  );
}
