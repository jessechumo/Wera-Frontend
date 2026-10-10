// Hand-written from real API responses saved in src/api/__fixtures__
// (FRONTEND_PLAN.md section 2). Field names are exactly what the API returns.

export type AppStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'not_interested';

export interface Job {
  id: number;
  company_id: number;
  company: string;
  industry: string;
  source: string;
  ext_id: string;
  title: string;
  location_raw: string | null;
  is_remote: boolean | null;
  url: string;
  department: string | null;
  posted_at: string | null;
  first_seen_at: string;
  stage: string;
  matched_categories: string[];
  exclude_reason: string | null;
  exclude_evidence: string | null;
  fit_score: number | null;
  verdict: string | null;
  seniority: string | null;
  years_required: number | null;
  sponsorship: 'yes' | 'unknown' | 'no' | null;
  work_mode: 'remote' | 'hybrid' | 'onsite' | null;
  location_summary: string | null;
  skills_matched: string[] | null;
  skills_missing: string[] | null;
  reason: string | null;
  application_status: AppStatus | null;
  application_notes: string | null;
}

export interface DeepGap {
  gap: string;
  address: string;
}

export interface DeepRaw {
  why_fit: string[];
  resume_bullets: string[];
  gaps: DeepGap[];
  interview_topics: string[];
}

export interface DeepAnalysis {
  kind: 'deep';
  model: string;
  created_at: string;
  fit_score: number;
  reason: string;
  prompt_tokens: number;
  cached_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  latency_ms: number;
  raw: DeepRaw;
}

export interface JobDetail extends Job {
  deep: DeepAnalysis | null;
}

export interface JobList {
  count: number;
  jobs: Job[];
}

export interface DayCount {
  day: string;
  count: number;
}

export interface Stats {
  by_stage: Record<string, number>;
  by_industry: Record<string, number>;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  new_per_day: DayCount[];
  applications_per_week: number;
}

export interface Run {
  id: number;
  started_at: string;
  finished_at: string | null;
  // 'ok' | 'partial' | 'failed', or null while the run is in flight
  // (runs rows are inserted bare and only get a status when finished).
  status: 'ok' | 'partial' | 'failed' | null;
  companies_ok: number;
  companies_failed: number;
  jobs_seen: number;
  jobs_new: number;
  jobs_excluded: number;
  jobs_scored: number;
  prompt_tokens: number;
  cached_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  error: string | null;
}

export interface RunsList {
  runs: Run[];
}

export interface Company {
  id: number;
  name: string;
  ats: string;
  token: string;
  industry: string;
  enabled: boolean;
  last_fetch_at: string | null;
  last_fetch_ok: boolean | null;
  last_fetch_error: string | null;
  jobs_open: number;
  jobs_scored: number;
}

export interface CompaniesList {
  companies: Company[];
}

export interface UsageDay {
  day: string;
  prompt_tokens: number;
  cached_tokens: number;
  completion_tokens: number;
  cost_usd: number;
}

export interface UsageTotals {
  analyses: number;
  prompt_tokens: number;
  cached_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  cached_percent: number;
}

export interface Usage {
  per_day: UsageDay[];
  totals: UsageTotals;
}

export interface Industry {
  id: string;
  label: string;
  description: string;
  companies: number;
  open_jobs: number;
  /** The user's open, scored matches. */
  matches: number;
  top_score: number | null;
}

export interface IndustriesList {
  industries: Industry[];
}

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export interface Preferences {
  role_families: string[];
  levels: string[];
  max_years_required: number;
  us_only: boolean;
  needs_sponsorship: boolean;
}

export type WorkAuthorization =
  | 'citizen_or_resident'
  | 'sponsorship_now'
  | 'sponsorship_future'
  | 'outside_us';

export interface Answers {
  current_title?: string;
  years_experience?: number | null;
  work_authorization?: WorkAuthorization | '';
  locations?: string;
  work_modes?: ('remote' | 'hybrid' | 'onsite')[];
  industries?: string[];
  target_roles?: string;
  avoid?: string;
  notes?: string;
}

export interface Profile {
  markdown: string;
  preferences: Preferences;
  answers: Answers;
  /** Characters of resume text on file; 0 when none was uploaded. */
  resume_chars: number;
  /** Matching runs for this profile (text plus a family and a level). */
  ready: boolean;
  updated_at: string | null;
}

export interface Choice {
  id: string;
  label: string;
  description?: string;
}

export interface ProfileOptions {
  role_families: Choice[];
  levels: Choice[];
  industries: Choice[];
}

export interface MyUsage {
  monthly_budget_usd: number;
  month_spend_usd: number;
  remaining_usd: number;
}
