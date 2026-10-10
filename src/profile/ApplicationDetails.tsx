import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { ApiError } from '../api/client';
import { useApplicant, useSaveApplicant, useSuggestApplicant, type Applicant } from '../api/extension';
import { INPUT_CLS } from '../auth/AuthPage';
import { Skeleton } from '../components/States';
import { toast } from '../lib/toast';

type Key = keyof Applicant;

const DECLINE = { value: 'decline', label: 'Prefer not to say' };
const YES_NO = [{ value: '', label: 'Not set' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

const GROUPS: { title: string; hint?: string; fields: { key: Key; label: string; options?: { value: string; label: string }[]; wide?: boolean }[] }[] = [
  {
    title: 'Contact',
    fields: [
      { key: 'first_name', label: 'First name' }, { key: 'last_name', label: 'Last name' },
      { key: 'preferred_name', label: 'Preferred name' }, { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Street address' },
      { key: 'city', label: 'City' }, { key: 'state', label: 'State or province' },
      { key: 'postal_code', label: 'ZIP or postal code' }, { key: 'country', label: 'Country' },
    ],
  },
  {
    title: 'Links',
    fields: [{ key: 'linkedin', label: 'LinkedIn' }, { key: 'github', label: 'GitHub' }, { key: 'portfolio', label: 'Portfolio or website', wide: true }],
  },
  {
    title: 'Work authorization',
    hint: 'Answered the way forms ask. Wera fills these only when you set them.',
    fields: [
      { key: 'authorized_to_work', label: 'Authorized to work in the US', options: YES_NO },
      { key: 'needs_sponsorship', label: 'Will need visa sponsorship', options: YES_NO },
      { key: 'willing_to_relocate', label: 'Willing to relocate', options: YES_NO },
    ],
  },
  {
    title: 'Experience and education',
    fields: [
      { key: 'current_company', label: 'Current or last company' }, { key: 'current_title', label: 'Current or last title' },
      { key: 'years_experience', label: 'Years of experience' }, { key: 'school', label: 'School' },
      { key: 'degree', label: 'Degree' }, { key: 'major', label: 'Major' },
      { key: 'graduation_year', label: 'Graduation year' }, { key: 'gpa', label: 'GPA (optional)' },
    ],
  },
  {
    title: 'Other questions',
    fields: [
      { key: 'salary_expectation', label: 'Salary expectation', }, { key: 'start_date', label: 'Earliest start date' },
      { key: 'how_heard', label: 'How you heard about jobs', wide: true },
    ],
  },
  {
    title: 'Voluntary self-identification',
    hint: 'US employers ask these for equal-opportunity reporting. Answering is optional; "Prefer not to say" is filled unless you choose otherwise.',
    fields: [
      { key: 'gender', label: 'Gender', options: [DECLINE, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Non-binary', label: 'Non-binary' }] },
      { key: 'pronouns', label: 'Pronouns' },
      { key: 'hispanic', label: 'Hispanic or Latino', options: [DECLINE, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
      { key: 'race', label: 'Race', options: [DECLINE, ...['American Indian or Alaska Native', 'Asian', 'Black or African American', 'Native Hawaiian or Other Pacific Islander', 'White', 'Two or more races'].map((r) => ({ value: r, label: r }))] },
      { key: 'veteran', label: 'Veteran status', options: [DECLINE, { value: 'I am not a protected veteran', label: 'Not a protected veteran' }, { value: 'I am a protected veteran', label: 'Protected veteran' }] },
      { key: 'disability', label: 'Disability', options: [DECLINE, { value: 'No, I do not have a disability', label: 'No' }, { value: 'Yes, I have a disability', label: 'Yes' }] },
    ],
  },
];

function Labeled({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? 'sm:col-span-2' : undefined}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

/**
 * The details the Chrome extension fills into application forms. Saved
 * separately from the profile (which only the matching uses).
 */
export function ApplicationDetails() {
  const q = useApplicant();
  const save = useSaveApplicant();
  const suggest = useSuggestApplicant();
  const [draft, setDraft] = useState<Applicant | null>(null);
  const [loadedFrom, setLoadedFrom] = useState<typeof q.data>(undefined);
  if (q.data && q.data !== loadedFrom) {
    setLoadedFrom(q.data);
    setDraft(q.data.applicant);
  }
  // Arriving from the extension's "Edit your application details" link.
  const top = useRef<HTMLDivElement>(null);
  const ready = draft != null;
  useEffect(() => {
    if (ready && window.location.hash === '#application') top.current?.scrollIntoView({ block: 'start' });
  }, [ready]);
  if (!draft) return <Skeleton className="h-64 w-full" />;

  const set = (k: Key, v: string) => setDraft({ ...draft, [k]: v });
  const fromResume = () =>
    suggest.mutate(undefined, {
      onSuccess: ({ suggestions }) => {
        // Only fill blanks: never overwrite what the user typed.
        const next = { ...draft };
        let n = 0;
        for (const [k, v] of Object.entries(suggestions) as [Key, string][]) {
          if (v && k in next && !next[k]) {
            next[k] = v;
            n++;
          }
        }
        setDraft(next);
        toast.success(n ? `Filled ${n} field${n === 1 ? '' : 's'} from your resume. Review, then save.` : 'Nothing new found in your resume.');
      },
      onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not read your resume'),
    });

  return (
    <div ref={top} className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto max-w-xl text-xs text-muted">
          The Wera Chrome extension fills these into application forms. It never submits; you review every form.
          {!q.data?.saved && ' These start from your account and profile until you save them.'}
        </p>
        <button type="button" onClick={fromResume} disabled={suggest.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text hover:border-accent/40 disabled:opacity-60">
          {suggest.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} Fill blanks from my resume
        </button>
      </div>
      {GROUPS.map((g) => (
        <fieldset key={g.title}>
          <legend className="text-sm font-semibold text-text">{g.title}</legend>
          {g.hint && <p className="mt-0.5 text-xs text-faint">{g.hint}</p>}
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
            {g.fields.map((f) => (
              <Labeled key={f.key} label={f.label} wide={f.wide}>
                {f.options ? (
                  <select className={INPUT_CLS} value={draft[f.key]} onChange={(e) => set(f.key, e.target.value)} aria-label={f.label}>
                    {!f.options.some((o) => o.value === draft[f.key]) && draft[f.key] && <option value={draft[f.key]}>{draft[f.key]}</option>}
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input className={INPUT_CLS} value={draft[f.key]} onChange={(e) => set(f.key, e.target.value)} aria-label={f.label} />
                )}
              </Labeled>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center justify-end gap-3">
        {save.error && <span className="text-xs text-bad">{save.error instanceof ApiError ? save.error.message : 'Save failed'}</span>}
        <button type="button" disabled={save.isPending}
          onClick={() => save.mutate(draft, { onSuccess: () => toast.success('Application details saved.') })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/85 disabled:opacity-60">
          {save.isPending && <LoaderCircle className="size-4 animate-spin" />} Save details
        </button>
      </div>
    </div>
  );
}
