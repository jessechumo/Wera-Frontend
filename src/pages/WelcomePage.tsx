import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Sparkles } from 'lucide-react';
import { useMe } from '../api/auth';
import { ApiError } from '../api/client';
import { useDraftProfile, useProfile, useSaveProfile, useSuggestPreferences } from '../api/profile';
import type { Answers, Preferences, Suggestions } from '../api/types';
import { LOCATION_SEPARATOR, toPlace } from '../profile/places';
import { ProfileEditor } from '../profile/ProfileEditor';
import { DEFAULT_PREFS, PreferencesFields, prefsProblem } from '../profile/PreferencesFields';
import { ResumeUpload } from '../profile/ResumeUpload';
import { Skeleton } from '../components/States';
import { toast } from '../lib/toast';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { ThemeToggle } from '../lib/theme';
import { Logo } from '../components/Logo';

const STEPS = ['Resume', 'What you want', 'Your profile'] as const;

function errorText(err: unknown): string | null {
  if (!err) return null;
  return err instanceof ApiError ? err.message : 'Network error';
}

/** First-run setup: resume, preferences, then the AI-drafted profile. */
export default function WelcomePage() {
  useDocumentTitle('Welcome');
  const me = useMe();
  const profile = useProfile();
  const draft = useDraftProfile();
  const save = useSaveProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [answers, setAnswers] = useState<Answers>({});
  const [markdown, setMarkdown] = useState('');
  const [resumeChars, setResumeChars] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // Resume suggestions fill step 2 only until the user edits it themselves.
  const suggest = useSuggestPreferences();
  const [touched, setTouched] = useState(false);
  const [suggested, setSuggested] = useState(false);

  // Resume where the user left off.
  useEffect(() => {
    if (loaded || !profile.data) return;
    const p = profile.data;
    if (p.preferences.role_families.length > 0) setPrefs(p.preferences);
    setAnswers(p.answers ?? {});
    setMarkdown(p.markdown);
    setResumeChars(p.resume_chars);
    setLoaded(true);
  }, [profile.data, loaded]);

  const applySuggestions = (s: Suggestions) => {
    if (touched) return;
    setPrefs((p) => ({
      ...p,
      role_families: s.role_families.length ? s.role_families : p.role_families,
      levels: s.levels.length ? s.levels : p.levels,
      // Leave room above their experience: 3 years in -> hide jobs asking 5+.
      max_years_required:
        s.years_experience != null ? Math.max(2, Math.ceil(s.years_experience) + 2) : p.max_years_required,
    }));
    setAnswers((a) => ({
      ...a,
      current_title: a.current_title || s.current_title,
      years_experience: a.years_experience ?? s.years_experience,
      target_roles: a.target_roles || s.target_roles,
      locations:
        a.locations ||
        [...new Set(s.locations.map(toPlace))].join(LOCATION_SEPARATOR) ||
        undefined,
    }));
    setSuggested(true);
  };
  const runSuggest = () => suggest.mutate(undefined, { onSuccess: applySuggestions });

  const runDraft = () =>
    draft.mutate({ preferences: prefs, answers }, { onSuccess: (r) => setMarkdown(r.markdown) });

  // Entering the last step drafts automatically the first time.
  const next = () => {
    const to = step + 1;
    setStep(to);
    // A resume uploaded in an earlier visit still pre-fills the form.
    if (to === 1 && resumeChars > 0 && !suggested && !suggest.isPending && !touched) runSuggest();
    if (to === 2 && !markdown && !draft.isPending) runDraft();
    window.scrollTo({ top: 0 });
  };

  const finish = () =>
    save.mutate(
      { markdown, preferences: prefs, answers },
      {
        onSuccess: () => {
          toast.success('Saved. Matching your jobs now; scores arrive over the next few minutes.');
          navigate('/', { replace: true });
        },
      },
    );

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl p-6 pt-16">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  const problem = prefsProblem(prefs);
  const firstName = me.data?.name?.split(' ')[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <h1 className="mt-4 text-[26px] leading-tight font-semibold">
          {firstName ? `Welcome, ${firstName}.` : 'Welcome.'} Let's find your jobs.
        </h1>
        <p className="mt-1 text-sm text-muted">
          Wera watches 400+ companies' job boards and scores every new posting against your
          background. This takes about three minutes.
        </p>
      </div>

      <ol className="mb-6 flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={clsx(
                'flex size-6 items-center justify-center rounded-full border font-mono',
                i < step && 'border-good/50 bg-good/10 text-good',
                i === step && 'border-accent bg-accent/15 text-accent',
                i > step && 'border-border text-faint',
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={i === step ? 'font-medium text-text' : 'text-muted'}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="anim-rise rounded-card border border-border bg-surface p-5">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Your resume</h2>
              <p className="mt-1 text-xs text-muted">
                The AI reads it to learn your skills and experience. You can skip this and describe
                yourself in the next step instead.
              </p>
            </div>
            <ResumeUpload
              resumeChars={resumeChars}
              onUploaded={(chars) => {
                setResumeChars(chars);
                setTouched(false);
                runSuggest();
              }}
            />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-5">
            {suggest.isPending ? (
              <div className="flex items-center gap-2 rounded-lg border border-accent-2/30 bg-accent-2/10 px-3 py-2 text-xs text-accent-2">
                <LoaderCircle className="size-3.5 animate-spin" />
                Reading your resume to pre-fill this…
              </div>
            ) : (
              suggested && (
                <div className="flex items-center gap-2 rounded-lg border border-accent-2/30 bg-accent-2/10 px-3 py-2 text-xs text-accent-2">
                  <Sparkles className="size-3.5" />
                  Pre-filled from your resume. Add or remove anything that doesn't fit.
                </div>
              )
            )}
            <PreferencesFields
              prefs={prefs}
              answers={answers}
              onPrefs={(p) => {
                setTouched(true);
                setPrefs(p);
              }}
              onAnswers={(a) => {
                setTouched(true);
                setAnswers(a);
              }}
            />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Your profile</h2>
            <ProfileEditor
              value={markdown}
              onChange={setMarkdown}
              onDraft={runDraft}
              drafting={draft.isPending}
              draftError={errorText(draft.error)}
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted hover:text-text disabled:invisible"
        >
          <ArrowLeft className="size-3.5" /> Back
        </button>
        <div className="flex items-center gap-3">
          {step === 1 && problem && <span className="text-xs text-warn">{problem}</span>}
          {step === 2 && save.error && (
            <span role="alert" className="text-xs text-bad">
              {errorText(save.error)}
            </span>
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              disabled={step === 1 && problem != null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors duration-150 hover:bg-accent/85 disabled:opacity-50"
            >
              {step === 0 && resumeChars === 0 ? 'Skip' : 'Continue'}
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={save.isPending || draft.isPending || markdown.trim() === ''}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors duration-150 hover:bg-accent/85 disabled:opacity-50"
            >
              {save.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save and find my jobs
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
