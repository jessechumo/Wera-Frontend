import { Link } from 'react-router-dom';
import { Download, ExternalLink, FileText, LoaderCircle, RefreshCw, Wand2 } from 'lucide-react';
import { ApiError } from '../api/client';
import { useJobKeywords, useJobResume, useTailorResume, type Coverage } from '../api/resumes';
import type { JobDetail } from '../api/types';
import { ResumePreview } from '../resume/ResumePreview';
import { useLivePreview } from '../resume/useLivePreview';
import { toast } from '../lib/toast';

export function CoverageChips({ coverage, label }: { coverage: Coverage; label: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-xs">
        <span className="font-medium text-text">{label}</span>
        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
          <span className="block h-full rounded-full bg-good" style={{ width: `${coverage.percent}%` }} />
        </span>
        <span className="font-mono text-muted">{coverage.percent}%</span>
      </div>
      <div className="flex flex-wrap gap-1 text-[11px]">
        {coverage.matched.map((k) => <span key={k} className="rounded-full bg-good/10 px-2 py-0.5 text-good">{k}</span>)}
        {coverage.missing.map((k) => (
          <span key={k} className="rounded-full bg-warn/10 px-2 py-0.5 text-warn" title="Not on your resume. Add it only if it is true.">{k}</span>
        ))}
      </div>
    </div>
  );
}

/** The job view's Resume tab: keyword coverage and a tailored copy. */
export function JobResumePanel({ job }: { job: JobDetail }) {
  const kw = useJobKeywords(job.id);
  const tailored = useJobResume(job.id);
  const tailor = useTailorResume(job.id);
  const doc = tailored.data ?? null;
  const preview = useLivePreview(doc?.data ?? null, doc?.layout ?? null);
  const noBase = kw.data && kw.data.resume_id == null;

  const run = () => tailor.mutate(undefined, {
    onSuccess: (r) => toast.success(r.resume.fit?.one_page ? 'Tailored and fitted to one page.' : 'Tailored.'),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not tailor'),
  });

  if (kw.isLoading || tailored.isLoading) return <div className="skeleton h-72 w-full" />;
  if (noBase) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border px-6 py-12 text-center">
        <FileText className="size-5 text-accent" />
        <p className="text-sm font-semibold">Set up your resume first</p>
        <p className="max-w-sm text-xs text-muted">Import your LaTeX resume or your uploaded PDF once; then every job gets a tailored, one-page copy in a click.</p>
        <Link to="/resume" className="mt-1 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent/85">Set up my resume</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {kw.data?.coverage && kw.data.keywords.length > 0 && (
        <CoverageChips coverage={kw.data.coverage} label={doc ? 'Tailored resume covers' : 'Your resume covers'} />
      )}
      {!doc ? (
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-xs leading-relaxed text-muted">
            Tailor a copy of your resume for {job.company}: the AI reorders skills and rewords bullets toward this posting
            using only what your resume says, then it is fitted to one page. Your main resume is not changed.
          </p>
          <button onClick={run} disabled={tailor.isPending}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent/85 disabled:opacity-60">
            {tailor.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            {tailor.isPending ? 'Tailoring…' : 'Tailor my resume'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            <Link to={`/resume/${doc.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:bg-accent/85">
              <ExternalLink className="size-3.5" /> Edit
            </Link>
            <a href={`/api/resumes/${doc.id}/pdf?download=1`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40">
              <Download className="size-3.5" /> PDF
            </a>
            <button onClick={run} disabled={tailor.isPending} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted hover:text-text">
              {tailor.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Tailor again
            </button>
          </div>
          {doc.notes.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted">{doc.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
          <ResumePreview {...preview} />
        </>
      )}
    </div>
  );
}
