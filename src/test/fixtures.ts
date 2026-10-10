// Default API responses for page tests: the real responses saved in
// src/api/__fixtures__ plus small hand-made ones for newer endpoints.
import companies from '../api/__fixtures__/companies.json';
import excluded from '../api/__fixtures__/excluded.json';
import job from '../api/__fixtures__/job.json';
import jobs from '../api/__fixtures__/jobs.json';
import runs from '../api/__fixtures__/runs.json';
import stats from '../api/__fixtures__/stats.json';
import today from '../api/__fixtures__/today.json';
import usage from '../api/__fixtures__/usage.json';
import type { Profile, User } from '../api/types';
import { mockApi } from './render';

export const fixtures = { companies, excluded, job, jobs, runs, stats, today, usage };

export const me: User = {
  id: 1, email: 'ada@example.com', name: 'Ada Lovelace', is_admin: true, created_at: '2026-09-01T00:00:00Z',
};

export const profile: Profile = {
  markdown: '# Candidate Profile\n## Target roles\nSite reliability.',
  resume_text: 'Ada Lovelace\nSRE intern',
  resume_file: { filename: 'resume.pdf', uploaded_at: '2026-10-01T00:00:00Z' },
  preferences: { role_families: ['sre'], levels: ['entry'], max_years_required: 3, us_only: true, needs_sponsorship: true },
  answers: { current_title: 'SRE intern', work_authorization: 'sponsorship_future' },
  resume_chars: 1200,
  ready: true,
  updated_at: '2026-10-01T00:00:00Z',
};

export const options = {
  role_families: [
    { id: 'sre', label: 'Site reliability' },
    { id: 'platform', label: 'Platform engineering' },
    { id: 'data_science', label: 'Data science' },
  ],
  levels: [
    { id: 'entry', label: 'Entry level' },
    { id: 'mid', label: 'Mid level' },
    { id: 'senior', label: 'Senior' },
  ],
  industries: [{ id: 'trading', label: 'Trading & HFT' }],
  work_authorization: [
    { id: 'citizen_or_resident', label: 'Citizen or permanent resident' },
    { id: 'sponsorship_future', label: 'Will need sponsorship later' },
  ],
};

export const industries = {
  industries: [
    { id: 'trading', label: 'Trading & HFT', description: 'Market makers', companies: 12, open_jobs: 340, matches: 25, top_score: 88 },
    { id: 'ai_ml', label: 'AI & Machine Learning', description: 'Labs', companies: 30, open_jobs: 900, matches: 40, top_score: 82 },
  ],
};

/** A posting body for job detail responses (the saved job.json predates it). */
export const POSTING =
  'About the role\n\nKeep trading systems fast and reliable.\n\n- Linux\n- Python\n\nWe sponsor visas for this role.';

type Handler = Parameters<typeof mockApi>[0][string];

/** Stubs every endpoint the app reads with fixtures; overrides win. */
export function stubApi(overrides: Record<string, Handler> = {}) {
  return mockApi({
    'GET /api/auth/me': () => ({ user: me, avatar_version: null }),
    'GET /api/profile': () => profile,
    'GET /api/profile/options': () => options,
    'GET /api/industries': () => industries,
    'GET /api/today': () => today,
    'GET /api/jobs': () => jobs,
    'GET /api/excluded': () => excluded,
    'GET /api/stats': () => stats,
    'GET /api/runs': () => runs,
    'GET /api/usage': () => ({ ...usage, users: [] }),
    'GET /api/usage/me': () => ({ month_spend_usd: 0.42, monthly_budget_usd: 10, remaining_usd: 9.58, analyses: 120 }),
    'GET /api/companies': () => companies,
    'GET /api/settings': () => ({
      theme: 'system', default_sort: 'score', hidden_companies: [],
      notifications: { email_digest: true, frequency: 'daily', strong_matches: true, min_score: 80, product_updates: false },
    }),
    // Every listed job opens with the fixture detail (description etc.).
    ...Object.fromEntries(
      [...jobs.jobs, ...today.jobs, ...excluded.jobs, job].flatMap((j) => [
        [`GET /api/jobs/${j.id}`, () => ({ ...job, ...j, description: POSTING, deep: null })],
        [`GET /api/jobs/${j.id}/cover-letter`, () => new Response('{"error":"none"}', { status: 404 })],
      ]),
    ),
    ...overrides,
  });
}
