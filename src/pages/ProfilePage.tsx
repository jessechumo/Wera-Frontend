import { useEffect, useState, type FormEvent } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { useChangePassword, useMe } from '../api/auth';
import { ApiError } from '../api/client';
import { useDraftProfile, useMyUsage, useProfile, useSaveProfile } from '../api/profile';
import type { Answers, Preferences } from '../api/types';
import { Field, INPUT_CLS } from '../auth/AuthPage';
import { ErrorState, Skeleton } from '../components/States';
import { money } from '../lib/format';
import { toast } from '../lib/toast';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { ProfileEditor } from '../profile/ProfileEditor';
import { DEFAULT_PREFS, PreferencesFields, prefsProblem } from '../profile/PreferencesFields';
import { ResumeUpload } from '../profile/ResumeUpload';

function errorText(err: unknown): string | null {
  if (!err) return null;
  return err instanceof ApiError ? err.message : 'Network error';
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      {hint && <p className="mt-0.5 mb-4 text-xs text-muted">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

function UsageCard() {
  const usage = useMyUsage();
  const u = usage.data;
  const pct = u && u.monthly_budget_usd > 0 ? Math.min(100, (u.month_spend_usd / u.monthly_budget_usd) * 100) : 0;
  return (
    <Card title="AI usage this month" hint="Scoring and profile drafts run on a shared AI budget.">
      {!u ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-mono text-lg text-text">{money(u.month_spend_usd)}</span>
            <span className="text-muted">of {money(u.monthly_budget_usd)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={pct > 90 ? 'h-full bg-bad' : 'h-full bg-accent'}
              style={{ width: `${pct}%` }}
            />
          </div>
          {u.remaining_usd <= 0 && (
            <p className="text-xs text-warn">
              Budget used up: new jobs wait unscored until next month.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function PasswordCard() {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    change.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          toast.success('Password changed. Other sessions were logged out.');
        },
      },
    );
  };
  return (
    <Card title="Password">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Current password">
          <input
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="New password" hint="At least 10 characters.">
          <input
            type="password"
            required
            minLength={10}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            className={INPUT_CLS}
          />
        </Field>
        {change.error && <p className="text-xs text-bad">{errorText(change.error)}</p>}
        <button
          type="submit"
          disabled={change.isPending}
          className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text hover:border-accent/40 disabled:opacity-60"
        >
          Change password
        </button>
      </form>
    </Card>
  );
}

export default function ProfilePage() {
  useDocumentTitle('Profile');
  const me = useMe();
  const profile = useProfile();
  const draft = useDraftProfile();
  const save = useSaveProfile();

  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [answers, setAnswers] = useState<Answers>({});
  const [markdown, setMarkdown] = useState('');
  const [resumeChars, setResumeChars] = useState(0);
  const [dirty, setDirty] = useState(false);

  // Load the saved profile into the form (again after each save).
  useEffect(() => {
    const p = profile.data;
    if (!p || dirty) return;
    setPrefs(p.preferences);
    setAnswers(p.answers ?? {});
    setMarkdown(p.markdown);
    setResumeChars(p.resume_chars);
  }, [profile.data, dirty]);

  const edit =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setDirty(true);
    };

  if (profile.isLoading) return <Skeleton className="h-96 w-full" />;
  if (profile.error) return <ErrorState message={String(profile.error)} onRetry={() => void profile.refetch()} />;

  const problem = prefsProblem(prefs) ?? (markdown.trim() === '' ? 'The profile text is empty.' : null);
  const onSave = () =>
    save.mutate(
      { markdown, preferences: prefs, answers },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success('Saved. Rematching your jobs in the background.');
        },
      },
    );

  return (
    <div className="space-y-5 pb-20">
      <header>
        <h1 className="text-[28px] leading-tight font-semibold">Profile</h1>
        <p className="mt-1 text-xs text-muted">
          {me.data?.email} · Changes to what you want or to the profile text rematch your jobs.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card title="What you want">
            <PreferencesFields
              prefs={prefs}
              answers={answers}
              onPrefs={edit(setPrefs)}
              onAnswers={edit(setAnswers)}
            />
          </Card>
          <Card title="Profile text">
            <ProfileEditor
              value={markdown}
              onChange={edit(setMarkdown)}
              onDraft={() =>
                draft.mutate(
                  { preferences: prefs, answers },
                  {
                    onSuccess: (r) => {
                      setMarkdown(r.markdown);
                      setDirty(true);
                    },
                  },
                )
              }
              drafting={draft.isPending}
              draftError={errorText(draft.error)}
            />
          </Card>
        </div>
        <div className="space-y-5">
          <Card title="Resume" hint="Upload a new version, then redraft the profile text.">
            <ResumeUpload resumeChars={resumeChars} onUploaded={setResumeChars} />
          </Card>
          <UsageCard />
          <PasswordCard />
        </div>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 backdrop-blur lg:pl-56">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-3 md:px-6">
            {(problem || save.error) && (
              <span className="text-xs text-warn">{problem ?? errorText(save.error)}</span>
            )}
            <button
              type="button"
              onClick={() => {
                setDirty(false);
                void profile.refetch();
              }}
              className="rounded-lg px-3 py-2 text-xs text-muted hover:text-text"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={problem != null || save.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/85 disabled:opacity-50"
            >
              {save.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
