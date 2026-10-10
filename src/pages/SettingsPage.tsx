import { useState, type FormEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import { Bell, Download, EyeOff, KeyRound, LoaderCircle, Palette, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { useChangePassword, useDeleteAccount, useMe } from '../api/auth';
import { api, ApiError } from '../api/client';
import { useHideCompany, useIndustryLabel, useSaveSettings, useSettings } from '../api/hooks';
import type { JobList, Settings } from '../api/types';
import { Field, INPUT_CLS } from '../auth/AuthPage';
import { ErrorState, Skeleton } from '../components/States';
import { Switch } from '../components/Switch';
import { ThemeChoice } from '../lib/theme';
import { toast } from '../lib/toast';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function errorText(err: unknown): string | null {
  if (!err) return null;
  return err instanceof ApiError ? err.message : 'Network error';
}

function Section({ icon: Icon, title, hint, children, tone }: {
  icon: typeof Bell; title: string; hint?: string; children: ReactNode; tone?: 'danger';
}) {
  return (
    <section className={clsx('rounded-card border bg-surface p-5', tone === 'danger' ? 'border-bad/30' : 'border-border')}>
      <div className="mb-4 flex items-start gap-3">
        <span className={clsx('mt-0.5 rounded-lg p-1.5', tone === 'danger' ? 'bg-bad/10 text-bad' : 'bg-surface-2 text-muted')}>
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4 pl-0 sm:pl-10">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-text">{label}</div>
        {hint && <div className="text-xs text-faint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
            value === o.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PasswordForm() {
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
          toast.success('Password changed. Your other sessions were signed out.');
        },
      },
    );
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="Current password">
        <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={INPUT_CLS} />
      </Field>
      <Field label="New password">
        <input type="password" required minLength={10} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={INPUT_CLS} />
      </Field>
      <button type="submit" disabled={change.isPending} className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-xs font-medium text-text hover:border-accent/40 disabled:opacity-60">
        Update
      </button>
      {change.error && <p className="text-xs text-bad sm:col-span-3">{errorText(change.error)}</p>}
    </form>
  );
}

/** Downloads every job with an application status as CSV. */
async function exportApplications() {
  const data = await api<JobList>('/api/jobs?limit=200&include_excluded=true');
  const rows = data.jobs.filter((j) => j.application_status);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    ['company', 'title', 'status', 'fit_score', 'location', 'url', 'notes'].join(','),
    ...rows.map((j) =>
      [j.company, j.title, j.application_status, j.fit_score, j.location_summary ?? j.location_raw, j.url, j.application_notes]
        .map(esc)
        .join(','),
    ),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'wera-applications.csv' });
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} application${rows.length === 1 ? '' : 's'}.`);
}

function DeleteAccount() {
  const del = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  if (!open) {
    return (
      <Row label="Delete account" hint="Removes your profile, matches, tracker, letters and files. This cannot be undone.">
        <button onClick={() => setOpen(true)} className="rounded-lg border border-bad/40 px-3 py-1.5 text-xs font-medium text-bad hover:bg-bad/10">
          Delete account…
        </button>
      </Row>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // A full page load: nothing of the deleted account stays in memory.
        del.mutate(password, { onSuccess: () => window.location.replace('/signup') });
      }}
      className="space-y-3 rounded-lg border border-bad/30 bg-bad/5 p-4"
    >
      <p className="text-sm text-text">Enter your password to permanently delete your account.</p>
      <input type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={INPUT_CLS} />
      {del.error && <p className="text-xs text-bad">{errorText(del.error)}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={del.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-bad px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {del.isPending && <LoaderCircle className="size-3.5 animate-spin" />} Delete forever
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-text">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  useDocumentTitle('Settings');
  const me = useMe();
  const settings = useSettings();
  const save = useSaveSettings();
  const hide = useHideCompany();
  const industryLabel = useIndustryLabel();
  const [draft, setDraft] = useState<Settings | null>(null);

  if (settings.data && !draft) {
    const { hidden_companies: _hidden, ...rest } = settings.data;
    setDraft(rest);
  }

  if (settings.isLoading || !draft) return <Skeleton className="h-96 w-full" />;
  if (settings.error) return <ErrorState message={String(settings.error)} onRetry={() => void settings.refetch()} />;

  const update = (next: Settings) => {
    setDraft(next);
    save.mutate(next, { onError: (e) => toast.error(`Couldn't save: ${errorText(e)}`) });
  };
  const n = draft.notifications;
  const setN = (patch: Partial<Settings['notifications']>) => update({ ...draft, notifications: { ...n, ...patch } });
  const hidden = settings.data?.hidden_companies ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <header>
        <h1 className="text-[28px] leading-tight font-semibold">Settings</h1>
        <p className="mt-1 text-xs text-muted">Changes save as you make them.</p>
      </header>

      <Section icon={Palette} title="Appearance">
        <Row label="Theme" hint="Match system follows your device's light or dark setting.">
          <ThemeChoice />
        </Row>
      </Section>

      <Section icon={SlidersHorizontal} title="Job feed">
        <Row label="Sort jobs by" hint="The default order on the Jobs page.">
          <Segmented
            label="Default sort"
            value={draft.default_sort}
            onChange={(v) => update({ ...draft, default_sort: v })}
            options={[
              { value: 'score', label: 'Best fit' },
              { value: 'newest', label: 'Newest' },
            ]}
          />
        </Row>
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-text">
            <EyeOff className="size-3.5 text-faint" /> Hidden companies
          </div>
          {hidden.length === 0 ? (
            <p className="text-xs text-faint">None. Hide a company from any job's detail view; its jobs disappear and are never scored.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {hidden.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {c.name} <span className="text-xs text-faint">· {industryLabel(c.industry)}</span>
                  </span>
                  <button onClick={() => hide.mutate({ id: c.id, hidden: false })} className="text-xs font-medium text-accent hover:underline">
                    Unhide
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications" hint="Email notifications are coming soon. Your choices are saved now and will apply when they launch.">
        <Row label="Match digest" hint="A summary of your best new matches.">
          <Switch label="Match digest" checked={n.email_digest} onChange={(v) => setN({ email_digest: v })} />
        </Row>
        <Row label="Digest frequency">
          <Segmented
            label="Digest frequency"
            value={n.frequency}
            onChange={(v) => setN({ frequency: v })}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
          />
        </Row>
        <Row label="Strong match alerts" hint={`An alert when a new job scores ${n.min_score} or higher.`}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={60}
              max={95}
              step={5}
              value={n.min_score}
              disabled={!n.strong_matches}
              onChange={(e) => setN({ min_score: Number(e.target.value) })}
              aria-label="Alert threshold"
              className="w-28 accent-accent disabled:opacity-40"
            />
            <Switch label="Strong match alerts" checked={n.strong_matches} onChange={(v) => setN({ strong_matches: v })} />
          </div>
        </Row>
        <Row label="Product updates" hint="Occasional news about new Wera features.">
          <Switch label="Product updates" checked={n.product_updates} onChange={(v) => setN({ product_updates: v })} />
        </Row>
      </Section>

      <Section icon={KeyRound} title="Account" hint={me.data?.email}>
        <PasswordForm />
        <Row label="Export applications" hint="Every job you saved, applied to or tracked, as CSV.">
          <button onClick={() => void exportApplications()} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text hover:border-accent/40">
            <Download className="size-3.5" /> Download CSV
          </button>
        </Row>
      </Section>

      <Section icon={ShieldAlert} title="Danger zone" tone="danger">
        <DeleteAccount />
      </Section>
    </div>
  );
}
