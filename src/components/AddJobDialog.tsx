import { useEffect, useState, type FormEvent } from 'react';
import { LoaderCircle, Sparkles, X } from 'lucide-react';
import { ApiError } from '../api/client';
import { useAddJob, useIndustries, useReadPosting, type NewJob } from '../api/hooks';
import { INPUT_CLS } from '../lib/styles';
import { toast } from '../lib/toast';
import { Field } from './Field';

const EMPTY: NewJob = { url: '', company: '', title: '', location: '', work_mode: '', industry: '', description: '' };

const MODES = [
  { value: '', label: 'Not stated' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
];

function errorText(e: unknown) {
  return e instanceof ApiError ? e.message : 'Something went wrong';
}

/**
 * Adds a job found anywhere on the web. Pasting the posting lets the AI
 * fill in the rest. Wera scores it for you, saves it to the tracker, and
 * offers it to everyone else it suits.
 */
export function AddJobDialog({ onClose, onAdded }: { onClose: () => void; onAdded: (id: number) => void }) {
  const [job, setJob] = useState<NewJob>(EMPTY);
  const add = useAddJob();
  const read = useReadPosting();
  const industries = useIndustries().data?.industries ?? [];
  const set = (patch: Partial<NewJob>) => setJob((j) => ({ ...j, ...patch }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canRead = job.description.trim().length >= 200 && !read.isPending;
  const readPosting = () =>
    read.mutate({ url: job.url, text: job.description }, {
      onSuccess: (d) => {
        if (!d.is_job_posting) {
          toast.error('That text does not look like a job posting.');
          return;
        }
        // Only fill what is still empty: anything typed by hand wins.
        setJob((j) => ({
          ...j,
          company: j.company || d.company,
          title: j.title || d.title,
          location: j.location || d.location,
          work_mode: j.work_mode || d.work_mode,
          industry: j.industry || d.industry,
          description: d.description || j.description,
        }));
      },
      onError: (e) => toast.error(errorText(e)),
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    add.mutate(job, {
      onSuccess: (saved) => {
        toast.success(`Added ${saved.title}. Wera is scoring it and sharing it with others it suits.`);
        onAdded(saved.id);
      },
      onError: (err) => toast.error(errorText(err)),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-10">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Add a job"
        onSubmit={submit}
        className="anim-rise relative w-full max-w-2xl space-y-4 rounded-card border border-border bg-bg p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div>
            <h2 className="text-lg font-semibold">Add a job</h2>
            <p className="text-xs text-muted">
              Found a posting Wera does not watch? Add it: Wera scores it for you, saves it to your tracker, and shows it to other people it suits.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text">
            <X className="size-4" />
          </button>
        </div>

        <Field label="Link to the posting">
          <input required type="url" value={job.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" className={INPUT_CLS} autoFocus />
        </Field>

        <Field label="Posting text" hint="Paste the whole posting, then let Wera fill the fields below. Or fill them yourself.">
          <textarea value={job.description} onChange={(e) => set({ description: e.target.value })} rows={6} className={`${INPUT_CLS} resize-y`} />
        </Field>
        <button
          type="button"
          onClick={readPosting}
          disabled={!canRead}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium hover:border-accent/40 disabled:opacity-50"
        >
          {read.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-accent" />}
          Fill from the posting
        </button>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company">
            <input required value={job.company} onChange={(e) => set({ company: e.target.value })} className={INPUT_CLS} />
          </Field>
          <Field label="Title">
            <input required value={job.title} onChange={(e) => set({ title: e.target.value })} className={INPUT_CLS} />
          </Field>
          <Field label="Location">
            <input value={job.location} onChange={(e) => set({ location: e.target.value })} placeholder="Austin, TX" className={INPUT_CLS} />
          </Field>
          <Field label="Work mode">
            <select value={job.work_mode} onChange={(e) => set({ work_mode: e.target.value })} className={INPUT_CLS}>
              {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Industry">
            <select value={job.industry} onChange={(e) => set({ industry: e.target.value })} className={INPUT_CLS}>
              <option value="">Other</option>
              {industries.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-text">Cancel</button>
          <button
            type="submit"
            disabled={add.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent/85 disabled:opacity-60"
          >
            {add.isPending && <LoaderCircle className="size-3.5 animate-spin" />} Add job
          </button>
        </div>
      </form>
    </div>
  );
}
