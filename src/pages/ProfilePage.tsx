import { useEffect, useRef, useState } from 'react';
import { Camera, Download, FileText, LoaderCircle, Save } from 'lucide-react';
import { useAvatar, useMe } from '../api/auth';
import { ApiError } from '../api/client';
import { useDraftProfile, useMyUsage, useProfile, useSaveProfile } from '../api/profile';
import type { Answers, Preferences } from '../api/types';
import { Avatar } from '../components/Avatar';
import { ErrorState, Skeleton } from '../components/States';
import { money, relTime } from '../lib/format';
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

function ProfileHeader() {
  const me = useMe();
  const avatar = useAvatar();
  const input = useRef<HTMLInputElement>(null);
  const user = me.data;
  if (!user) return null;
  return (
    <section className="flex flex-wrap items-center gap-5 rounded-card border border-border bg-surface p-5">
      <div className="group relative">
        <Avatar user={user} size={72} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-label="Change profile picture"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        >
          {avatar.isPending ? <LoaderCircle className="size-5 animate-spin" /> : <Camera className="size-5" />}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) avatar.mutate(f, { onError: (err) => toast.error(errorText(err) ?? 'Upload failed') });
            e.target.value = '';
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-[26px] leading-tight font-semibold">{user.name || 'Your profile'}</h1>
        <p className="mt-0.5 text-sm text-muted">{user.email}</p>
        <p className="mt-1 text-xs text-faint">Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => input.current?.click()} className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text hover:border-accent/40">
          {user.avatar_version ? 'Change photo' : 'Add photo'}
        </button>
        {user.avatar_version && (
          <button onClick={() => avatar.mutate(null)} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-bad">
            Remove
          </button>
        )}
      </div>
    </section>
  );
}

function ResumeCard({ resumeChars, onUploaded }: { resumeChars: number; onUploaded: (n: number) => void }) {
  const profile = useProfile();
  const [showText, setShowText] = useState(false);
  const file = profile.data?.resume_file;
  return (
    <Card title="Resume" hint="Upload a new version, then redraft the profile text.">
      {file && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-2">
          <FileText className="size-4 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-text">{file.filename}</div>
            <div className="text-[11px] text-faint">Uploaded {relTime(file.uploaded_at)}</div>
          </div>
          <a href="/api/profile/resume/file" target="_blank" rel="noreferrer" className="rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10">
            View
          </a>
          <a href="/api/profile/resume/file?download=1" className="rounded-md p-1 text-muted hover:text-text" aria-label="Download resume">
            <Download className="size-3.5" />
          </a>
        </div>
      )}
      <ResumeUpload resumeChars={resumeChars} onUploaded={onUploaded} />
      {profile.data?.resume_text && (
        <div className="mt-3">
          <button onClick={() => setShowText((v) => !v)} className="text-xs font-medium text-muted hover:text-text">
            {showText ? 'Hide' : 'Show'} the text Wera read
          </button>
          {showText && (
            <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-border bg-surface-2/50 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted">
              {profile.data.resume_text}
            </pre>
          )}
        </div>
      )}
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
      <ProfileHeader />
      <header className="sr-only">
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
        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <ResumeCard resumeChars={resumeChars} onUploaded={setResumeChars} />
          <UsageCard />
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
