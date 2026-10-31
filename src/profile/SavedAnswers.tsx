import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Pencil, Search, Trash2 } from 'lucide-react';
import { errorMessage } from '../api/client';
import { useForgetAnswer, useSavedAnswers, useUpdateAnswer, type SavedAnswer } from '../api/extension';
import { relTime } from '../lib/format';
import { INPUT_CLS } from '../lib/styles';
import { Skeleton } from '../components/States';
import { toast } from '../lib/toast';

function AnswerRow({ a }: { a: SavedAnswer }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(a.answer);
  const update = useUpdateAnswer();
  const forget = useForgetAnswer();
  const save = () =>
    update.mutate({ id: a.id, answer: text }, {
      onSuccess: () => setEditing(false),
      onError: (e) => toast.error(errorMessage(e, 'Could not save the answer')),
    });
  return (
    <li className="rounded-lg border border-border bg-surface-2/40 p-3">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-xs font-medium text-text">{a.question}</p>
        <button type="button" onClick={() => setEditing((v) => !v)} aria-label={`Edit the answer to ${a.question}`} className="rounded p-1 text-faint hover:text-text">
          <Pencil className="size-3.5" />
        </button>
        <button type="button" disabled={forget.isPending} onClick={() => forget.mutate(a.id)} aria-label={`Forget the answer to ${a.question}`} className="rounded p-1 text-faint hover:text-bad">
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          {a.kind === 'long'
            ? <textarea className={`${INPUT_CLS} h-28 resize-y`} value={text} onChange={(e) => setText(e.target.value)} aria-label={`Answer to ${a.question}`} />
            : <input className={INPUT_CLS} value={text} onChange={(e) => setText(e.target.value)} aria-label={`Answer to ${a.question}`} />}
          <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-1.5 text-xs text-muted hover:text-text" onClick={() => { setText(a.answer); setEditing(false); }}>Cancel</button>
            <button type="button" disabled={update.isPending || !text.trim()} onClick={save}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:bg-accent/85 disabled:opacity-60">
              {update.isPending && <LoaderCircle className="size-3.5 animate-spin" />} Save
            </button>
          </div>
        </div>
      ) : (
        <p className={`mt-1 whitespace-pre-line text-xs text-muted ${a.kind === 'long' ? 'line-clamp-3' : ''}`}>{a.answer}</p>
      )}
      <p className="mt-1.5 text-[11px] text-faint">
        {a.company ? `Last given for ${a.company}, ` : 'Last given '}{relTime(a.updated_at)}{a.uses > 1 ? ` · used ${a.uses} times` : ''}
      </p>
    </li>
  );
}

/**
 * Answers the Chrome extension remembered from application forms, which it
 * offers the next time a form asks the same question. Edit or forget any.
 */
export function SavedAnswers() {
  const q = useSavedAnswers();
  const forget = useForgetAnswer();
  const [filter, setFilter] = useState('');
  // Arriving from the extension's "saved answers" link.
  const top = useRef<HTMLDivElement>(null);
  const ready = q.isSuccess;
  useEffect(() => {
    if (ready && window.location.hash === '#answers') top.current?.scrollIntoView({ block: 'start' });
  }, [ready]);
  if (q.isPending) return <Skeleton className="h-32 w-full" />;
  if (q.isLoadingError) return <p className="text-xs text-bad">{errorMessage(q.error, 'Could not load your saved answers')}</p>;
  const all = q.data.answers;
  if (!all.length) {
    return <p className="text-xs text-muted">None yet. When you fill an application with the extension, the answers you give are kept here and offered on the next form that asks.</p>;
  }
  const needle = filter.trim().toLowerCase();
  const shown = needle ? all.filter((a) => `${a.question} ${a.answer} ${a.company}`.toLowerCase().includes(needle)) : all;
  return (
    <div ref={top} className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint" />
          <input className={`${INPUT_CLS} pl-8`} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`Search ${all.length} answers`} aria-label="Search saved answers" />
        </label>
        <button type="button" disabled={forget.isPending}
          onClick={() => window.confirm('Forget every saved answer? The extension will ask again on the next forms.') && forget.mutate(undefined, { onSuccess: () => toast.success('Saved answers forgotten.') })}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-bad/40 hover:text-bad">
          Forget all
        </button>
      </div>
      <ul className="space-y-2">{shown.map((a) => <AnswerRow key={a.id} a={a} />)}</ul>
      {!shown.length && <p className="text-xs text-muted">No answer matches “{filter}”.</p>}
    </div>
  );
}
