import { useEffect, useState } from 'react';
import { Copy, Download, LoaderCircle, PenLine, RefreshCw, Sparkles } from 'lucide-react';
import { useMe } from '../api/auth';
import { ApiError } from '../api/client';
import { useCoverLetter, useWriteCoverLetter } from '../api/hooks';
import type { JobDetail } from '../api/types';
import { toast } from '../lib/toast';

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Network error';
}

const today = () => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

/** Opens a print dialog with just the letter, laid out on a page (Save as PDF). */
function printLetter(name: string, email: string, company: string, title: string, body: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const paras = body.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cover letter - ${esc(company)}</title>
<style>@page{margin:1in}body{font:11.5pt/1.55 Georgia,'Iowan Old Style',serif;color:#1d1f24;max-width:6.5in;margin:0 auto}
.h{margin-bottom:28px}.n{font-size:15pt;font-weight:700}.m{color:#5f6470;font-size:10pt}p{margin:0 0 12px}</style></head>
<body><div class="h"><div class="n">${esc(name)}</div><div class="m">${esc(email)}</div><div class="m" style="margin-top:14px">${esc(today())}</div>
<div class="m" style="margin-top:14px">Hiring Team, ${esc(company)}<br>Re: ${esc(title)}</div></div>${paras}</body></html>`;
  const frame = document.createElement('iframe');
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  window.setTimeout(() => frame.remove(), 1000);
}

/** The cover letter for a job: generate, read on a page, edit, copy, print. */
export function CoverLetterPanel({ job }: { job: JobDetail }) {
  const me = useMe();
  const letter = useCoverLetter(job.id, true);
  const write = useWriteCoverLetter(job.id);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  useEffect(() => setText(letter.data?.body ?? ''), [letter.data?.body]);

  const name = me.data?.name || me.data?.email || '';
  const generate = () => write.mutate(undefined, { onError: (e) => toast.error(errorText(e)) });
  const writing = write.isPending && write.variables === undefined;

  if (letter.isLoading) return <div className="skeleton h-96 w-full" />;
  if (!letter.data && !writing) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border px-6 py-16 text-center">
        <span className="rounded-full bg-accent/10 p-3 text-accent">
          <PenLine className="size-5" />
        </span>
        <h3 className="text-base font-semibold text-text">A cover letter for {job.company}</h3>
        <p className="max-w-sm text-xs leading-relaxed text-muted">
          Written from your profile and resume for this role. It connects your experience to what the team needs
          without repeating your resume, and you can edit every word.
        </p>
        <button onClick={generate} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/85">
          <Sparkles className="size-4" /> Write my letter
        </button>
        <span className="text-[11px] text-faint">Takes about five seconds.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {editing ? (
          <>
            <button
              onClick={() =>
                write.mutate(text, {
                  onSuccess: () => {
                    setEditing(false);
                    toast.success('Letter saved.');
                  },
                  onError: (e) => toast.error(errorText(e)),
                })
              }
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:bg-accent/85"
            >
              Save
            </button>
            <button onClick={() => { setEditing(false); setText(letter.data?.body ?? ''); }} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-text">
              Cancel
            </button>
          </>
        ) : (
          <>
            <ToolButton icon={PenLine} label="Edit" onClick={() => setEditing(true)} disabled={writing} />
            <ToolButton
              icon={Copy}
              label="Copy"
              onClick={() => void navigator.clipboard.writeText(letter.data?.body ?? '').then(() => toast.success('Copied.'))}
              disabled={writing}
            />
            <ToolButton
              icon={Download}
              label="Download PDF"
              onClick={() => printLetter(name, me.data?.email ?? '', job.company, job.title, letter.data?.body ?? '')}
              disabled={writing}
            />
            <ToolButton icon={writing ? LoaderCircle : RefreshCw} label={writing ? 'Writing…' : 'Rewrite'} onClick={generate} disabled={writing} spin={writing} />
          </>
        )}
        {letter.data?.edited && !editing && <span className="ml-auto text-[11px] text-faint">Edited by you</span>}
      </div>

      <article className="rounded-card border border-border bg-surface px-7 py-8 shadow-sm sm:px-10">
        <header className="mb-6">
          <div className="text-lg font-semibold text-text">{name}</div>
          <div className="text-xs text-muted">{me.data?.email}</div>
          <div className="mt-3 text-xs text-muted">{today()}</div>
          <div className="mt-3 text-xs text-muted">
            Hiring Team, {job.company}
            <br />
            Re: {job.title}
          </div>
        </header>
        {writing ? (
          <div className="space-y-2.5">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className={`skeleton h-3 ${i % 4 === 3 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>
        ) : editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={20}
            aria-label="Cover letter"
            className="w-full resize-y rounded-lg border border-border bg-surface-2/50 p-3 font-serif text-[14px] leading-relaxed text-text focus:border-accent/60"
          />
        ) : (
          <div className="space-y-3.5 font-serif text-[14.5px] leading-[1.65] text-text">
            {(letter.data?.body ?? '').split(/\n{2,}/).map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

function ToolButton({ icon: Icon, label, onClick, disabled, spin }: {
  icon: typeof Copy; label: string; onClick: () => void; disabled?: boolean; spin?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent/40 disabled:opacity-60"
    >
      <Icon className={`size-3.5 ${spin ? 'animate-spin' : ''}`} /> {label}
    </button>
  );
}
