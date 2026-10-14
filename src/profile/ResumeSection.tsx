import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileCode2, FileText, LoaderCircle, Sparkles, Upload } from 'lucide-react';
import { errorMessage } from '../api/client';
import {
  useImportResume, useResume, useResumes, type ResumeDoc,
} from '../api/resumes';
import { useProfile } from '../api/profile';
import { ErrorState, Skeleton } from '../components/States';
import { toast } from '../lib/toast';
import { Workspace } from '../resume/Workspace';

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
        else navigate(`/profile/resume/${doc.id}`);
      },
      onError: (e) => toast.error(errorMessage(e, 'Something went wrong')),
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

function Building({ filename }: { filename: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-16 text-center">
      <LoaderCircle className="size-6 animate-spin text-accent" />
      <p className="text-sm font-semibold">Building your resume from {filename}</p>
      <p className="max-w-md text-xs text-muted">
        Every line is copied as written into the standard one-page layout, so you can edit it, fit it to a page and tailor it to jobs. This takes a few seconds.
      </p>
    </div>
  );
}

/** First open, when nothing was built in the background: build the resume from the uploaded one now. */
function AutoImport({ filename, onFallback }: { filename: string; onFallback: () => void }) {
  const imp = useImportResume();
  const navigate = useNavigate();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    imp.mutate({ source: 'profile' }, {
      onSuccess: (doc) => {
        toast.success(doc.notes.length ? `Built from ${filename}. ${doc.notes.length} line${doc.notes.length === 1 ? '' : 's'} to check.` : `Built from ${filename}.`);
        navigate(`/profile/resume/${doc.id}`, { replace: true });
      },
      onError: (e) => {
        toast.error(`Could not read ${filename}: ${errorMessage(e, 'Something went wrong')}`);
        onFallback();
      },
    });
  }, [imp, filename, navigate, onFallback]);
  return <Building filename={filename} />;
}

/**
 * The Resume tab of the profile: the editable resume (prefilled from the
 * uploaded one), its tailored copies, and the live preview.
 */
export function ResumeSection() {
  const params = useParams();
  const navigate = useNavigate();
  const list = useResumes();
  const profile = useProfile();
  const [reimport, setReimport] = useState(false);
  const [manual, setManual] = useState(false);
  const fallback = useCallback(() => setManual(true), []);
  const base = list.data?.resumes.find((r) => r.job_id == null);
  const id = params.id ? Number(params.id) : (base?.id ?? null);
  const doc = useResume(id);

  if (list.isLoading || profile.isLoading) return <Skeleton className="h-96 w-full" />;
  if (list.error) return <ErrorState message={errorMessage(list.error, 'Something went wrong')} onRetry={() => void list.refetch()} />;
  const resumes = list.data?.resumes ?? [];
  const upload = profile.data?.resume_chars ? (profile.data.resume_file?.filename ?? 'your uploaded resume') : null;
  // The upload is usually turned into a resume in the background before the tab is opened.
  const background = list.data?.import;

  if (resumes.length === 0 && upload && !manual) {
    if (background?.status === 'running') return <Building filename={upload} />;
    if (!background) return <AutoImport filename={upload} onFallback={fallback} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Edit your resume, keep it to one page, and tailor a copy for any job from its Resume tab.</p>
        {resumes.length > 0 && (
          <div className="flex items-center gap-2">
            <select value={id ?? ''} onChange={(e) => navigate(`/profile/resume/${e.target.value}`)} aria-label="Resume"
              className="w-60 max-w-full truncate rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.job_id == null ? 'My resume' : `Tailored: ${r.job_title} at ${r.job_company}`}</option>
              ))}
            </select>
            {id === base?.id && (
              <button onClick={() => setReimport((v) => !v)} className="rounded-lg px-2 py-1.5 text-xs text-muted hover:text-text">{reimport ? 'Cancel' : 'Re-import'}</button>
            )}
          </div>
        )}
      </div>

      {resumes.length === 0 || reimport ? (
        <>
          {reimport && <p className="text-xs text-warn">Importing replaces your main resume. Tailored copies stay as they are.</p>}
          {!reimport && background?.status === 'failed' && (
            <p className="text-xs text-warn">Wera could not build your resume from {upload ?? 'your upload'}: {background.error}. Choose a way to start below.</p>
          )}
          <CreateResume replace={reimport} onDone={reimport ? (d) => { setReimport(false); navigate(`/profile/resume/${d.id}`); } : undefined} />
        </>
      ) : doc.isLoading || !doc.data ? (
        doc.error ? <ErrorState message={errorMessage(doc.error, 'Something went wrong')} /> : <Skeleton className="h-96 w-full" />
      ) : (
        <Workspace key={doc.data.id} doc={doc.data} />
      )}
    </div>
  );
}
