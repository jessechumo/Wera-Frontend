import clsx from 'clsx';
import { useProfileOptions } from '../api/profile';
import type { Answers, Preferences, WorkAuthorization } from '../api/types';
import { Field, INPUT_CLS } from '../auth/AuthPage';
import { Skeleton } from '../components/States';
import { ChipSelect } from './ChipSelect';

const WORK_AUTH: { id: WorkAuthorization; label: string }[] = [
  { id: 'citizen_or_resident', label: 'U.S. citizen or green card' },
  { id: 'sponsorship_future', label: 'Authorized now (e.g. OPT), sponsorship later' },
  { id: 'sponsorship_now', label: 'Need visa sponsorship now' },
  { id: 'outside_us', label: 'Outside the U.S.' },
];

const WORK_MODES = [
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'onsite', label: 'Onsite' },
];

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** What the user is looking for: drives both the filter and the AI draft. */
export function PreferencesFields({
  prefs,
  answers,
  onPrefs,
  onAnswers,
}: {
  prefs: Preferences;
  answers: Answers;
  onPrefs: (p: Preferences) => void;
  onAnswers: (a: Answers) => void;
}) {
  const options = useProfileOptions();
  if (!options.data) return <Skeleton className="h-64 w-full" />;
  const { role_families, levels, industries } = options.data;

  const setAuth = (auth: WorkAuthorization) => {
    onAnswers({ ...answers, work_authorization: auth });
    onPrefs({
      ...prefs,
      needs_sponsorship: auth === 'sponsorship_now' || auth === 'sponsorship_future',
      us_only: auth !== 'outside_us',
    });
  };

  return (
    <div className="space-y-6">
      <Section title="Roles" hint="Pick every kind of role you'd apply to. Jobs outside these are hidden.">
        <ChipSelect
          label="Role families"
          options={role_families}
          value={prefs.role_families}
          onChange={(v) => onPrefs({ ...prefs, role_families: v })}
        />
        <Field label="In your own words (optional)">
          <input
            value={answers.target_roles ?? ''}
            onChange={(e) => onAnswers({ ...answers, target_roles: e.target.value })}
            placeholder="e.g. data scientist on flight operations, ML engineer"
            className={INPUT_CLS}
          />
        </Field>
      </Section>

      <Section title="Experience">
        <ChipSelect
          label="Seniority levels"
          options={levels}
          value={prefs.levels}
          onChange={(v) => onPrefs({ ...prefs, levels: v })}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Current or last title">
            <input
              value={answers.current_title ?? ''}
              onChange={(e) => onAnswers({ ...answers, current_title: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Years of experience">
            <input
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={answers.years_experience ?? ''}
              onChange={(e) =>
                onAnswers({
                  ...answers,
                  years_experience: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Hide jobs asking for more than" hint="Years; 0 means no limit.">
            <input
              type="number"
              min={0}
              max={50}
              value={prefs.max_years_required}
              onChange={(e) => onPrefs({ ...prefs, max_years_required: Number(e.target.value) || 0 })}
              className={INPUT_CLS}
            />
          </Field>
        </div>
      </Section>

      <Section title="Work authorization" hint="Used to hide jobs that refuse visa sponsorship.">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {WORK_AUTH.map((w) => (
            <label
              key={w.id}
              className={clsx(
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors duration-150',
                answers.work_authorization === w.id
                  ? 'border-accent/60 bg-accent/10 text-text'
                  : 'border-border bg-surface-2 text-muted hover:border-accent/40',
              )}
            >
              <input
                type="radio"
                name="work_authorization"
                checked={answers.work_authorization === w.id}
                onChange={() => setAuth(w.id)}
                className="accent-accent"
              />
              {w.label}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.needs_sponsorship}
              onChange={(e) => onPrefs({ ...prefs, needs_sponsorship: e.target.checked })}
              className="accent-accent"
            />
            Hide jobs that refuse sponsorship
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.us_only}
              onChange={(e) => onPrefs({ ...prefs, us_only: e.target.checked })}
              className="accent-accent"
            />
            U.S. jobs only
          </label>
        </div>
      </Section>

      <Section title="Where and how">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Locations">
            <input
              value={answers.locations ?? ''}
              onChange={(e) => onAnswers({ ...answers, locations: e.target.value })}
              placeholder="e.g. Dallas, Seattle, or anywhere in the US"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Work modes">
            <ChipSelect
              label="Work modes"
              options={WORK_MODES}
              value={answers.work_modes ?? []}
              onChange={(v) => onAnswers({ ...answers, work_modes: v as Answers['work_modes'] })}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Industries you'd like most"
        hint="Optional. Jobs from every industry still show up; these score higher."
      >
        <ChipSelect
          label="Preferred industries"
          options={industries}
          value={answers.industries ?? []}
          onChange={(v) => onAnswers({ ...answers, industries: v })}
        />
      </Section>

      <Section title="Anything else">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Avoid">
            <input
              value={answers.avoid ?? ''}
              onChange={(e) => onAnswers({ ...answers, avoid: e.target.value })}
              placeholder="e.g. defense work, on-call heavy roles"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Notes">
            <input
              value={answers.notes ?? ''}
              onChange={(e) => onAnswers({ ...answers, notes: e.target.value })}
              placeholder="Anything a recruiter should know"
              className={INPUT_CLS}
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}

export const DEFAULT_PREFS: Preferences = {
  role_families: [],
  levels: ['entry', 'mid'],
  max_years_required: 5,
  us_only: true,
  needs_sponsorship: false,
};

/** Why the preferences can't be saved yet, or null. */
export function prefsProblem(p: Preferences): string | null {
  if (p.role_families.length === 0) return 'Pick at least one kind of role.';
  if (p.levels.length === 0) return 'Pick at least one seniority level.';
  return null;
}
