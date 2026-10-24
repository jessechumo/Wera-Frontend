import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  CheckCircle2, ChevronDown, Code2, Download, Eye, FileText, LayoutTemplate, LoaderCircle, Maximize2, PenLine,
  Redo2, SlidersHorizontal, Stethoscope, Trash2, Undo2, Wand2,
} from 'lucide-react';
import { errorMessage } from '../api/client';
import { useDeleteResume, useFitResume, useSaveResume, useTemplates, type Layout, type ResumeData, type ResumeDoc } from '../api/resumes';
import { toast } from '../lib/toast';
import { hiddenCount, showAll, targetId, type Issues } from './edit';
import { LatexEditor } from './LatexEditor';
import { ResumeForm } from './ResumeForm';
import { ResumePreview } from './ResumePreview';
import { ReviewPanel, ScoreBadge } from './ReviewPanel';
import { TemplatePicker } from './TemplatePicker';
import { useHistory } from './useHistory';
import { useLivePreview } from './useLivePreview';

const BTN = 'inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-accent/40 disabled:opacity-50';

/** A small popover anchored under its button; closes on outside click or Escape. */
function Popover({ label, icon, children, align = 'left' }: { label: string; icon: React.ReactNode; children: React.ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={clsx(BTN, open && 'border-accent/40 text-accent')}>
        {icon} {label} <ChevronDown className="size-3 opacity-60" />
      </button>
      {open && (
        <div className={clsx('anim-rise absolute top-full z-30 mt-1.5 min-w-60 rounded-xl border border-border bg-bg p-2 shadow-xl', align === 'right' ? 'right-0' : 'left-0')}
          onClick={(e) => (e.target as HTMLElement).closest('[data-close]') && setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <label className="block px-1 py-1">
      <span className="flex justify-between text-[11px] text-muted"><span>{label}</span><span className="font-mono">{fmt(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
    </label>
  );
}

function MenuItem({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" data-close onClick={onClick} className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-surface-2">
      <span className="mt-0.5 text-accent">{icon}</span>
      <span><span className="block text-xs font-medium text-text">{label}</span><span className="block text-[11px] text-faint">{hint}</span></span>
    </button>
  );
}

type Tab = 'edit' | 'latex' | 'review';

/** Editor, LaTeX and review beside a live preview, autosaving as you go. */
export function Workspace({ doc }: { doc: ResumeDoc }) {
  const save = useSaveResume(doc.id);
  const fit = useFitResume(doc.id);
  const del = useDeleteResume();
  const navigate = useNavigate();
  const templates = useTemplates();
  const history = useHistory<ResumeData>(doc.data);
  const draft = history.value;
  const [layout, setLayout] = useState<Layout>(doc.layout);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>('edit');
  const [picker, setPicker] = useState(false);
  const [latexPreview, setLatexPreview] = useState<ResumeData | null>(null);
  const [synced, setSynced] = useState(doc.updated_at);

  // Adopt newer server changes (fitting, tailoring) when nothing local is
  // pending; a fit is an undoable step.
  if (Date.parse(doc.updated_at) > Date.parse(synced) && !dirty) {
    setSynced(doc.updated_at);
    if (JSON.stringify(doc.data) !== JSON.stringify(draft)) history.set(doc.data);
    setLayout(doc.layout);
  }

  // Counts local changes: a save clears "dirty" only if nothing changed while it was in flight
  // (else the edits made meanwhile would never be saved, though the page said "Saved").
  const edits = useRef(0);
  const changed = useCallback(() => { edits.current++; setDirty(true); }, []);
  const edit = useCallback((d: ResumeData) => { history.set(d); changed(); }, [history, changed]);
  const editLayout = (l: Layout) => { setLayout(l); changed(); };
  const undo = () => { history.undo(); changed(); };
  const redo = () => { history.redo(); changed(); };
  /** After a save of the copy as it was at `at` edits: synced, and clean unless edited since. */
  const savedAt = useCallback((at: number, s: ResumeDoc) => {
    setSynced(s.updated_at);
    if (edits.current === at) setDirty(false);
  }, []);

  // Autosave a moment after the last change.
  const saveNow = save.mutate;
  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => {
      const at = edits.current;
      saveNow({ data: draft, layout }, {
        onSuccess: (saved) => savedAt(at, saved),
        onError: (e) => toast.error(`Not saved: ${errorMessage(e, 'Something went wrong')}`),
      });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [draft, layout, dirty, saveNow, savedAt]);

  // Undo and redo from the keyboard, outside text fields (they keep their own).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || (e.target as HTMLElement).closest('input, textarea, [contenteditable]')) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey && history.canUndo) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { if (history.canRedo) { e.preventDefault(); redo(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const preview = useLivePreview(latexPreview ?? draft, layout);
  const issues: Issues = useMemo(() => {
    const m: Issues = new Map();
    for (const c of preview.review?.checks ?? []) if (c.target) m.set(c.target, [...(m.get(c.target) ?? []), c]);
    return m;
  }, [preview.review]);

  /** Saves pending edits, then runs next (downloads and fitting use the saved copy). */
  const withSaved = (next: () => void) => {
    if (!dirty) return next();
    const at = edits.current;
    save.mutate({ data: draft, layout }, { onSuccess: (s) => { savedAt(at, s); next(); }, onError: (e) => toast.error(errorMessage(e, 'Something went wrong')) });
  };
  const fitNow = () => withSaved(() => fit.mutate(undefined, {
    onSuccess: (d) => toast.success(d.fit?.summary ?? 'Fitted.'),
    onError: (e) => toast.error(errorMessage(e, 'Something went wrong')),
  }));
  const go = (path: string) => withSaved(() => { window.location.href = path; });

  const jump = (target: string) => {
    setTab('edit');
    window.setTimeout(() => {
      const el = document.getElementById(targetId(target));
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('resume-flash');
      window.setTimeout(() => el.classList.remove('resume-flash'), 1600);
      el.querySelector<HTMLElement>('textarea, input')?.focus({ preventScroll: true });
    }, 60);
  };

  const hidden = hiddenCount(draft);
  const template = templates.data?.templates.find((t) => t.id === (layout.template ?? 'ivy'));
  const status = save.isPending ? 'Saving…' : dirty ? 'Unsaved' : 'Saved';
  const filename = `${draft.name.trim().replace(/\s+/g, '_') || 'Resume'}_Resume.tex`;
  const TABS: { id: Tab; label: string; icon: typeof PenLine; badge?: number }[] = [
    { id: 'edit', label: 'Edit', icon: PenLine },
    { id: 'latex', label: 'LaTeX', icon: Code2 },
    { id: 'review', label: 'Review', icon: Stethoscope, badge: preview.review?.checks.filter((c) => c.severity !== 'tip').length },
  ];

  return (
    <div className="space-y-4">
      {doc.job_id != null && (
        <section className="rounded-card border border-accent/25 bg-accent/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Wand2 className="size-4 text-accent" />
            <span className="font-semibold">Tailored for {doc.job_title} at {doc.job_company}</span>
            <Link to={`/jobs?job=${doc.job_id}`} className="text-xs text-accent hover:underline">Open the job</Link>
          </div>
          {doc.coverage && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="mr-1 font-medium text-muted">Keywords {doc.coverage.percent}%</span>
              {doc.coverage.matched.map((k) => <span key={k} className="rounded-full bg-good/10 px-2 py-0.5 text-good">{k}</span>)}
              {doc.coverage.missing.map((k) => <span key={k} className="rounded-full bg-warn/10 px-2 py-0.5 text-warn" title="Not on your resume: add it only if it is true">{k}</span>)}
            </div>
          )}
          {doc.notes.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">{doc.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
        </section>
      )}

      <div className="z-20 -mx-1 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-bg/90 px-2 py-2 backdrop-blur xl:sticky xl:top-14">
        <button type="button" onClick={() => setPicker(true)} className={clsx(BTN, 'pr-3')} title="Change template">
          <LayoutTemplate className="size-3.5 text-accent" />
          <span className="text-faint">Template</span> <span className="font-semibold">{template?.name ?? 'Ivy'}</span>
        </button>
        <Popover label="Layout" icon={<SlidersHorizontal className="size-3.5" />}>
          <Slider label="Text size" value={layout.font_size} min={10} max={11} step={0.5} fmt={(v) => `${v}pt`} onChange={(v) => editLayout({ ...layout, font_size: v })} />
          <Slider label="Spacing" value={layout.spacing} min={0.7} max={1.2} step={0.02} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => editLayout({ ...layout, spacing: v })} />
          <Slider label="Margins" value={layout.margin} min={0.35} max={0.75} step={0.01} fmt={(v) => `${v.toFixed(2)} in`} onChange={(v) => editLayout({ ...layout, margin: v })} />
        </Popover>
        <button type="button" onClick={fitNow} disabled={fit.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:bg-accent/85 disabled:opacity-60">
          {fit.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Maximize2 className="size-3.5" />} Fit to one page
        </button>
        {hidden > 0 && (
          <button type="button" onClick={() => edit(showAll(draft))} className={BTN} title="Show everything that is hidden">
            <Eye className="size-3.5" /> {hidden} hidden
          </button>
        )}
        <span className="flex items-center">
          <button type="button" onClick={undo} disabled={!history.canUndo} aria-label="Undo" title="Undo (Ctrl+Z)" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30"><Undo2 className="size-4" /></button>
          <button type="button" onClick={redo} disabled={!history.canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30"><Redo2 className="size-4" /></button>
        </span>
        <a href="#resume-preview" className="text-xs font-medium text-accent xl:hidden">Preview ↓</a>
        <span className="ml-auto flex items-center gap-2">
          {preview.review && <ScoreBadge score={preview.review.score} onClick={() => setTab('review')} />}
          <Popover label="Download" icon={<Download className="size-3.5" />} align="right">
            <MenuItem icon={<Download className="size-4" />} label="PDF" hint="Ready to send, exactly as previewed" onClick={() => go(`/api/resumes/${doc.id}/pdf?download=1`)} />
            <MenuItem icon={<Code2 className="size-4" />} label="LaTeX (.tex)" hint={`${template?.name ?? 'Ivy'} template; opens in Overleaf`} onClick={() => go(`/api/resumes/${doc.id}/tex`)} />
            <MenuItem icon={<FileText className="size-4" />} label="Plain text" hint="For forms that want it pasted" onClick={() => go(`/api/resumes/${doc.id}/txt?download=1`)} />
          </Popover>
          <span className={clsx('inline-flex items-center gap-1 text-[11px]', dirty ? 'text-faint' : 'text-good')} aria-live="polite">
            {!dirty && !save.isPending && <CheckCircle2 className="size-3" />} {status}
          </span>
        </span>
      </div>
      {doc.fit && !dirty && <p className="-mt-2 text-[11px] text-faint">{doc.fit.summary}</p>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <div className="min-w-0">
          <div role="tablist" className="mb-3 flex gap-1 border-b border-border">
            {TABS.map((t) => (
              <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={clsx('-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                  tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text')}>
                <t.icon className="size-3.5" /> {t.label}
                {!!t.badge && <span className="rounded-full bg-warn/15 px-1.5 font-mono text-[10px] text-warn">{t.badge}</span>}
              </button>
            ))}
            {doc.job_id != null && (
              <button type="button" onClick={() => window.confirm('Delete this tailored resume?') && del.mutate(doc.id, { onSuccess: () => void navigate('/profile/resume') })}
                className="ml-auto inline-flex items-center gap-1 px-2 text-xs text-muted hover:text-bad">
                <Trash2 className="size-3.5" /> Delete copy
              </button>
            )}
          </div>
          {tab === 'edit' && <ResumeForm data={draft} onChange={edit} issues={issues} jobId={doc.job_id} />}
          {tab === 'latex' && <LatexEditor data={draft} layout={layout} filename={filename} onPreview={setLatexPreview} onApply={edit} />}
          {tab === 'review' && <ReviewPanel review={preview.review} onJump={jump} onFit={fitNow} />}
        </div>
        <div id="resume-preview" className="min-w-0 scroll-mt-16 xl:sticky xl:top-32">
          <ResumePreview {...preview} note={latexPreview ? 'Showing your LaTeX edits' : undefined} />
        </div>
      </div>

      {picker && <TemplatePicker data={draft} layout={layout} onChange={editLayout} onClose={() => setPicker(false)} />}
    </div>
  );
}
