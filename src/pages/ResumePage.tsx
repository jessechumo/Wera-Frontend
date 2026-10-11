import { useEffect, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { CheckCircle2, Download, Eye, FileCode2, FileText, LoaderCircle, Maximize2, SlidersHorizontal, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import { ApiError } from '../api/client';
import {
  useDeleteResume, useFitResume, useImportResume, useResume, useResumes, useSaveResume,
  type Layout, type ResumeData, type ResumeDoc,
} from '../api/resumes';
import { useProfile } from '../api/profile';
import { ErrorState, Skeleton } from '../components/States';
import { toast } from '../lib/toast';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { hiddenCount, showAll } from '../resume/edit';
import { ResumeForm } from '../resume/ResumeForm';
import { ResumePreview } from '../resume/ResumePreview';
import { useLivePreview } from '../resume/useLivePreview';

function errorText(e: unknown) {
  return e instanceof ApiError ? e.message : 'Something went wrong';
}

/** First visit: three ways to start. */
function CreateResume({ replace = false, onDone }: { replace?: boolean; onDone?: (doc: ResumeDoc) => void }) {
  const imp = useImportResume();
  const profile = useProfile();
  const navigate = useNavigate();
  const [tex, setTex] = useState('');
  const run = (v: Parameters<typeof imp.mutate>[0]) =>
    imp.mutate({ ...v, replace }, {
      onSuccess: (doc) => {
        if (doc.notes.length) toast.success(`Imported. ${doc.notes.length} line${doc.notes.length === 1 ? '' : 's'} to check.`);
        if (onDone) onDone(doc);
        else navigate(`/resume/${doc.id}`);
      },
      onError: (e) => toast.error(errorText(e)),
    });
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setTex(await f.text());
  };
  const hasUpload = (profile.data?.resume_chars ?? 0) > 0;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-card border border-border bg-surface p-5 lg:col-span-2">
        <div className="flex items-center gap-2"><FileCode2 className="size-4 text-accent" /><h2 className="text-sm font-semibold">Import your LaTeX resume</h2></div>
        <p className="mt-1 text-xs text-muted">Paste a resume written in the popular "Jake's resume" template (\resumeSubheading, \resumeItem...), or upload the .tex file. It is read exactly, no AI.</p>
        <textarea value={tex} onChange={(e) => setTex(e.target.value)} rows={8} spellCheck={false} aria-label="LaTeX source"
          placeholder={'\\documentclass[letterpaper,11pt]{article}\n...'} className="mt-3 w-full resize-y rounded-lg border border-border bg-surface-2/50 p-2 font-mono text-[11px] text-text focus:border-accent/60 focus:outline-none" />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40">
            <Upload className="size-3.5" /> Upload .tex<input type="file" accept=".tex,text/x-tex,text/plain" className="hidden" onChange={(e) => void onFile(e)} />
          </label>
          <button disabled={!tex.trim() || imp.isPending} onClick={() => run({ source: 'tex', tex })}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent/85 disabled:opacity-50">
            {imp.isPending && imp.variables?.source === 'tex' && <LoaderCircle className="size-3.5 animate-spin" />} Import
          </button>
        </div>
      </section>
      <div className="space-y-4">
        <section className="rounded-card border border-border bg-surface p-5">
          <div className="flex items-center gap-2"><Sparkles className="size-4 text-accent" /><h2 className="text-sm font-semibold">From your uploaded resume</h2></div>
          <p className="mt-1 text-xs text-muted">The AI arranges your uploaded resume into sections, copying every line word for word. Anything it reworded is flagged.</p>
          <button disabled={!hasUpload || imp.isPending} onClick={() => run({ source: 'profile' })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40 disabled:opacity-50">
            {imp.isPending && imp.variables?.source === 'profile' && <LoaderCircle className="size-3.5 animate-spin" />} Convert my resume
          </button>
          {!hasUpload && <p className="mt-2 text-[11px] text-faint">Upload one on the <Link to="/profile" className="text-accent hover:underline">Profile</Link> page first.</p>}
        </section>
        <section className="rounded-card border border-border bg-surface p-5">
          <div className="flex items-center gap-2"><FileText className="size-4 text-accent" /><h2 className="text-sm font-semibold">Start from the template</h2></div>
          <p className="mt-1 text-xs text-muted">Education, skills, experience and projects, ready to fill in.</p>
          <button disabled={imp.isPending} onClick={() => run({ source: 'blank' })}
            className="mt-3 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40">Start</button>
        </section>
      </div>
    </div>
  );
}

function LayoutControls({ layout, onChange }: { layout: Layout; onChange: (l: Layout) => void }) {
  const slider = (label: string, key: keyof Layout, min: number, max: number, step: number, fmt: (v: number) => string) => (
    <label className="block">
      <span className="flex justify-between text-[11px] text-muted"><span>{label}</span><span className="font-mono">{fmt(layout[key])}</span></span>
      <input type="range" min={min} max={max} step={step} value={layout[key]} aria-label={label}
        onChange={(e) => onChange({ ...layout, [key]: Number(e.target.value) })} className="w-full accent-accent" />
    </label>
  );
  return (
    <div className="space-y-2 rounded-card border border-border bg-surface p-3">
      {slider('Text size', 'font_size', 10, 11, 0.5, (v) => `${v}pt`)}
      {slider('Spacing', 'spacing', 0.7, 1.2, 0.02, (v) => `${Math.round(v * 100)}%`)}
      {slider('Margins', 'margin', 0.35, 0.75, 0.01, (v) => `${v.toFixed(2)}in`)}
    </div>
  );
}

/** Editor + live preview for one resume, autosaving as you type. */
function Workspace({ doc }: { doc: ResumeDoc }) {
  const save = useSaveResume(doc.id);
  const fit = useFitResume(doc.id);
  const del = useDeleteResume();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ResumeData>(doc.data);
  const [layout, setLayout] = useState<Layout>(doc.layout);
  const [dirty, setDirty] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const [synced, setSynced] = useState(doc.updated_at);
  // Adopt server changes (fit, tailoring) when nothing local is pending.
  if (doc.updated_at !== synced && !dirty) {
    setSynced(doc.updated_at);
    setDraft(doc.data);
    setLayout(doc.layout);
  }
  const preview = useLivePreview(draft, layout);

  const edit = (d: ResumeData) => {
    setDraft(d);
    setDirty(true);
  };
  const editLayout = (l: Layout) => {
    setLayout(l);
    setDirty(true);
  };
  // Autosave a moment after the last change. Each change re-runs this and
  // cancels the pending save, so the timer always saves the latest values.
  const saveNow = save.mutate;
  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => {
      saveNow({ data: draft, layout }, {
        onSuccess: (saved) => {
          setSynced(saved.updated_at);
          setDirty(false);
        },
        onError: (e) => toast.error(`Not saved: ${errorText(e)}`),
      });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [draft, layout, dirty, saveNow]);

  const fitNow = () => {
    const go = () => fit.mutate(undefined, {
      onSuccess: (d) => toast.success(d.fit?.summary ?? 'Fitted.'),
      onError: (e) => toast.error(errorText(e)),
    });
    if (dirty) {
      save.mutate({ data: draft, layout }, { onSuccess: () => { setDirty(false); go(); } });
    } else go();
  };
  const hidden = hiddenCount(draft);
  const status = save.isPending ? 'Saving…' : dirty ? 'Unsaved' : 'Saved';

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
          {doc.notes.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">{doc.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={fitNow} disabled={fit.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:bg-accent/85 disabled:opacity-60">
          {fit.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Maximize2 className="size-3.5" />} Fit to one page
        </button>
        {hidden > 0 && (
          <button onClick={() => edit(showAll(draft))} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40">
            <Eye className="size-3.5" /> Show {hidden} hidden
          </button>
        )}
        <button onClick={() => setShowLayout((v) => !v)} aria-expanded={showLayout}
          className={clsx('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium', showLayout ? 'border-accent/40 text-accent' : 'border-border bg-surface-2 hover:border-accent/40')}>
          <SlidersHorizontal className="size-3.5" /> Layout
        </button>
        <a href={`/api/resumes/${doc.id}/pdf?download=1`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40">
          <Download className="size-3.5" /> PDF
        </a>
        <a href={`/api/resumes/${doc.id}/tex`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40">
          <FileCode2 className="size-3.5" /> LaTeX
        </a>
        {doc.job_id != null && (
          <button onClick={() => window.confirm('Delete this tailored resume?') && del.mutate(doc.id, { onSuccess: () => navigate('/resume') })}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:text-bad">
            <Trash2 className="size-3.5" /> Delete
          </button>
        )}
        <span className={clsx('ml-auto inline-flex items-center gap-1 text-[11px]', dirty ? 'text-faint' : 'text-good')}>
          {!dirty && !save.isPending && <CheckCircle2 className="size-3" />} {status}
        </span>
      </div>
      {doc.fit && !dirty && <p className="-mt-2 text-[11px] text-faint">{doc.fit.summary}</p>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <ResumeForm data={draft} onChange={edit} />
        <div className="space-y-3 xl:sticky xl:top-20">
          {showLayout && <LayoutControls layout={layout} onChange={editLayout} />}
          <ResumePreview {...preview} />
        </div>
      </div>
    </div>
  );
}

export default function ResumePage() {
  useDocumentTitle('Resume');
  const params = useParams();
  const navigate = useNavigate();
  const list = useResumes();
  const [reimport, setReimport] = useState(false);
  const base = list.data?.resumes.find((r) => r.job_id == null);
  const id = params.id ? Number(params.id) : (base?.id ?? null);
  const doc = useResume(id);

  if (list.isLoading) return <Skeleton className="h-96 w-full" />;
  if (list.error) return <ErrorState message={errorText(list.error)} onRetry={() => void list.refetch()} />;
  const resumes = list.data?.resumes ?? [];

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">Resume</h1>
          <p className="mt-1 text-sm text-muted">Edit your resume, keep it to one page, and tailor a copy for any job.</p>
        </div>
        {resumes.length > 0 && (
          <div className="flex items-center gap-2">
            <select value={id ?? ''} onChange={(e) => navigate(`/resume/${e.target.value}`)} aria-label="Resume"
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.job_id == null ? 'My resume' : `Tailored: ${r.job_title} at ${r.job_company}`}</option>
              ))}
            </select>
            {id === base?.id && (
              <button onClick={() => setReimport((v) => !v)} className="rounded-lg px-2 py-1.5 text-xs text-muted hover:text-text">Re-import</button>
            )}
          </div>
        )}
      </header>

      {resumes.length === 0 || reimport ? (
        <>
          {reimport && <p className="text-xs text-warn">Importing replaces your base resume. Tailored copies stay as they are.</p>}
          <CreateResume replace={reimport} onDone={reimport ? (d) => { setReimport(false); navigate(`/resume/${d.id}`); } : undefined} />
        </>
      ) : doc.isLoading || !doc.data ? (
        doc.error ? <ErrorState message={errorText(doc.error)} /> : <Skeleton className="h-96 w-full" />
      ) : (
        <Workspace key={doc.data.id} doc={doc.data} />
      )}
    </div>
  );
}
