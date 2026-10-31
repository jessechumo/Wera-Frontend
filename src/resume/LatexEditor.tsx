import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, CircleAlert, Copy, Download, ExternalLink, LoaderCircle, RotateCcw } from 'lucide-react';
import { errorMessage } from '../api/client';
import { parseResumeTeX, resumeTeX, type Layout, type ResumeData } from '../api/resumes';
import { copyText } from '../lib/clipboard';
import { toast } from '../lib/toast';

/** Colors LaTeX: commands, braces, comments and escapes. */
function highlight(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(%[^\n]*)|(\\[a-zA-Z]+\*?)|(\\[^a-zA-Z\n])|([{}])|(\[[^\]\n]*\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    const cls = m[1] ? 'text-faint italic' : m[2] ? 'text-accent' : m[3] ? 'text-good' : m[4] ? 'text-muted' : 'text-warn';
    out.push(<span key={k++} className={cls}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  out.push(src.slice(last));
  return out;
}

function CodeArea({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const pre = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = value.split('\n').length;
  const sync = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (pre.current) {
      pre.current.scrollTop = e.currentTarget.scrollTop;
      pre.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
  };
  const shared = 'm-0 whitespace-pre p-3 font-mono text-[12px] leading-[1.6]';
  return (
    <div className="flex h-[70vh] min-h-96 overflow-hidden rounded-lg border border-border bg-surface focus-within:border-accent/60">
      <div ref={gutter} aria-hidden className="w-10 shrink-0 overflow-hidden border-r border-border bg-surface-2/50 py-3 pr-2 text-right font-mono text-[12px] leading-[1.6] text-faint select-none">
        {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <div className="relative min-w-0 flex-1">
        <pre ref={pre} aria-hidden className={clsx(shared, 'pointer-events-none absolute inset-0 overflow-hidden text-text')}>{highlight(value)}{'\n'}</pre>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} onScroll={sync} spellCheck={false} aria-label={label}
          wrap="off" autoCapitalize="off" autoCorrect="off"
          className={clsx(shared, 'absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent text-transparent caret-text selection:bg-accent/25 focus:outline-none')} />
      </div>
    </div>
  );
}

/** Opens the full file in Overleaf (a form post, as Overleaf documents it). */
function openInOverleaf(tex: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.overleaf.com/docs';
  form.target = '_blank';
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'snip';
  input.value = tex;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

/**
 * The resume as LaTeX. Edits are read back as you type (the preview
 * follows through onPreview) and applied to the resume with Apply.
 */
export function LatexEditor({ data, layout, filename, onApply, onPreview }: {
  data: ResumeData; layout: Layout; filename: string;
  onApply: (d: ResumeData) => void; onPreview: (d: ResumeData | null) => void;
}) {
  const [source, setSource] = useState<{ preamble: string; body: string } | null>(null);
  const [body, setBody] = useState('');
  const [parsed, setParsed] = useState<{ data: ResumeData | null; warnings: string[]; error: string; checking: boolean }>({ data: null, warnings: [], error: '', checking: false });
  const [showPreamble, setShowPreamble] = useState(false);
  const dirty = source != null && body !== source.body;

  // Generate the LaTeX for the resume as it is (again when the template changes).
  const look = `${layout.template}|${layout.accent}|${layout.paper}|${layout.font_size}|${layout.spacing}|${layout.margin}`;
  useEffect(() => {
    let live = true;
    resumeTeX(data, layout)
      .then((r) => { if (live) { setSource(r); setBody(r.body); } })
      .catch((e) => live && toast.error(errorMessage(e, 'Could not make the LaTeX')));
    return () => { live = false; };
  }, [look]); // eslint-disable-line react-hooks/exhaustive-deps -- regenerate on a new look, not on every edit

  // Read edits back shortly after typing stops.
  useEffect(() => {
    if (!dirty) {
      onPreview(null);
      return;
    }
    let live = true;
    const t = window.setTimeout(() => {
      setParsed((p) => ({ ...p, checking: true }));
      parseResumeTeX(body)
        .then((r) => { if (live) { setParsed({ data: r.data, warnings: r.warnings, error: '', checking: false }); onPreview(r.data); } })
        .catch((e) => { if (live) setParsed({ data: null, warnings: [], error: errorMessage(e, 'Could not read the LaTeX'), checking: false }); });
    }, 600);
    return () => { live = false; window.clearTimeout(t); };
  }, [body, dirty]); // eslint-disable-line react-hooks/exhaustive-deps -- onPreview is a setter
  useEffect(() => () => onPreview(null), []); // eslint-disable-line react-hooks/exhaustive-deps -- leaving the tab restores the preview

  if (!source) return <div className="skeleton h-96 w-full" />;
  const full = source.preamble + '\\begin{document}\n\n' + body + '\n\\end{document}\n';
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([full], { type: 'application/x-tex' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const apply = () => {
    if (!parsed.data) return;
    onApply(parsed.data);
    setSource({ ...source, body });
    toast.success('Applied your LaTeX edits.');
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={apply} disabled={!dirty || !parsed.data || parsed.checking}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:bg-accent/85 disabled:opacity-50">
          <Check className="size-3.5" /> Apply to resume
        </button>
        {dirty && (
          <button type="button" onClick={() => setBody(source.body)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted hover:text-text">
            <RotateCcw className="size-3.5" /> Discard edits
          </button>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => void copyText(full).then((ok) => (ok ? toast.success('Copied the whole file.') : toast.error("Couldn't copy.")))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium hover:border-accent/40">
            <Copy className="size-3.5" /> Copy
          </button>
          <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium hover:border-accent/40">
            <Download className="size-3.5" /> .tex
          </button>
          <button type="button" onClick={() => openInOverleaf(full)} title="Opens a new Overleaf project with this file"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium hover:border-accent/40">
            <ExternalLink className="size-3.5" /> Overleaf
          </button>
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        {!dirty ? (
          <span className="text-faint">The resume as LaTeX. Edit the content here; the preview follows.</span>
        ) : parsed.checking ? (
          <span className="inline-flex items-center gap-1 text-faint"><LoaderCircle className="size-3 animate-spin" /> Reading your edits…</span>
        ) : parsed.error ? (
          <span className="inline-flex items-center gap-1 text-bad"><CircleAlert className="size-3" /> {parsed.error}</span>
        ) : parsed.data ? (
          <span className="inline-flex items-center gap-1 text-good"><Check className="size-3" /> Read cleanly; the preview shows your edits. Apply to keep them.</span>
        ) : null}
      </div>
      {parsed.warnings.length > 0 && dirty && (
        <ul className="list-disc space-y-0.5 rounded-lg border border-warn/30 bg-warn/5 px-6 py-2 text-[11px] text-warn">
          {parsed.warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}
      <CodeArea value={body} onChange={setBody} label="LaTeX" />
      <div className="rounded-lg border border-border">
        <button type="button" onClick={() => setShowPreamble((v) => !v)} aria-expanded={showPreamble}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted hover:text-text">
          <ChevronDown className={clsx('size-3.5 transition-transform', !showPreamble && '-rotate-90')} />
          Template preamble (read only: it belongs to the template; download the file to change it)
        </button>
        {showPreamble && (
          <pre className="max-h-80 overflow-auto border-t border-border bg-surface-2/40 p-3 font-mono text-[11px] leading-relaxed whitespace-pre text-muted">{highlight(source.preamble)}</pre>
        )}
      </div>
    </div>
  );
}
