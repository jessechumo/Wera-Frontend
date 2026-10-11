import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';

export type SectionKind = 'entries' | 'projects' | 'compact' | 'skills' | 'summary';

export interface Bullet {
  id: string;
  text: string;
  hidden?: boolean;
}
export interface Entry {
  id: string;
  heading: string;
  subheading?: string;
  dates?: string;
  location?: string;
  tech?: string;
  text?: string;
  url?: string;
  link_label?: string;
  bullets?: Bullet[];
  hidden?: boolean;
}
export interface SkillGroup {
  id: string;
  name: string;
  items: string;
}
export interface Section {
  id: string;
  kind: SectionKind;
  title: string;
  hidden?: boolean;
  entries?: Entry[];
  skills?: SkillGroup[];
  text?: string;
}
export interface ResumeData {
  name: string;
  headline?: string;
  phone?: string;
  email?: string;
  location?: string;
  links?: { label: string; url: string }[];
  sections: Section[];
}
export type TemplateId = 'ivy' | 'parse' | 'signal' | 'ledger';
export interface Layout {
  font_size: number;
  spacing: number;
  margin: number;
  template?: TemplateId;
  accent?: string;
  paper?: 'us-letter' | 'a4';
}
export interface ResumeTemplate {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  uses_accent: boolean;
  ats: string;
}
export interface ReviewCheck {
  id: string;
  severity: 'fix' | 'improve' | 'tip';
  message: string;
  target?: string;
}
export interface Review {
  score: number;
  checks: ReviewCheck[];
}
export interface Measure {
  pages: number;
  fill: number;
}
export interface FitResult {
  layout: Layout;
  hidden: string[] | null;
  before: Measure;
  after: Measure;
  one_page: boolean;
  summary: string;
}
export interface Coverage {
  matched: string[];
  missing: string[];
  percent: number;
}
export interface ResumeDoc {
  id: number;
  title: string;
  job_id: number | null;
  job_title: string | null;
  job_company: string | null;
  data: ResumeData;
  layout: Layout;
  fit: FitResult | null;
  notes: string[];
  updated_at: string;
  coverage?: Coverage;
}
export interface ResumeSummary {
  id: number;
  title: string;
  job_id: number | null;
  job_title: string | null;
  job_company: string | null;
  one_page: boolean | null;
  updated_at: string;
}

export function useResumes() {
  return useQuery({ queryKey: ['resumes'], queryFn: () => api<{ resumes: ResumeSummary[] }>('/api/resumes') });
}

export function useResume(id: number | null) {
  return useQuery({
    queryKey: ['resume', id],
    queryFn: () => api<ResumeDoc>(`/api/resumes/${id}`),
    enabled: id != null,
  });
}

export function useImportResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { source: 'tex' | 'profile' | 'blank'; tex?: string; replace?: boolean }) =>
      api<ResumeDoc>('/api/resumes/import', { method: 'POST', body: JSON.stringify(v) }),
    onSuccess: (doc) => {
      qc.setQueryData(['resume', doc.id], doc);
      void qc.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}

export function useSaveResume(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { data: ResumeData; layout?: Layout; title?: string }) =>
      api<ResumeDoc>(`/api/resumes/${id}`, { method: 'PUT', body: JSON.stringify(v) }),
    onSuccess: (doc) => {
      qc.setQueryData(['resume', id], doc);
      void qc.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}

export function useFitResume(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<ResumeDoc>(`/api/resumes/${id}/fit`, { method: 'POST' }),
    onSuccess: (doc) => {
      qc.setQueryData(['resume', id], doc);
      void qc.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/resumes/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['resumes'] }),
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ['resume-templates'],
    queryFn: () => api<{ templates: ResumeTemplate[]; default_accent: string }>('/api/resumes/templates'),
    staleTime: Infinity,
  });
}

/** Renders unsaved edits: SVG pages, how full the last page is, and the review. */
export function previewResume(data: ResumeData, layout: Layout, signal?: AbortSignal) {
  return api<{ pages: string[]; measure: Measure; review?: Review }>('/api/resumes/preview', {
    method: 'POST',
    body: JSON.stringify({ data, layout }),
    signal,
  });
}

export function useJobKeywords(jobId: number) {
  return useQuery({
    queryKey: ['job-keywords', jobId],
    queryFn: () => api<{ keywords: string[]; coverage: Coverage | null; resume_id: number | null }>(`/api/jobs/${jobId}/keywords`),
  });
}

export function useJobResume(jobId: number) {
  return useQuery({
    queryKey: ['job-resume', jobId],
    queryFn: async () => {
      try {
        return await api<ResumeDoc>(`/api/jobs/${jobId}/resume`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });
}

export function useTailorResume(jobId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ resume: ResumeDoc; coverage_before: Coverage }>(`/api/jobs/${jobId}/resume`, { method: 'POST' }),
    onSuccess: (r) => {
      qc.setQueryData(['job-resume', jobId], r.resume);
      qc.setQueryData(['resume', r.resume.id], r.resume);
      void qc.invalidateQueries({ queryKey: ['resumes'] });
      void qc.invalidateQueries({ queryKey: ['job-keywords', jobId] });
    },
  });
}

/** The first page of a resume in every template. */
export function resumeThumbnails(data: ResumeData, layout: Layout, signal?: AbortSignal) {
  return api<{ thumbnails: Partial<Record<TemplateId, string>> }>('/api/resumes/thumbnails', {
    method: 'POST',
    body: JSON.stringify({ data, layout }),
    signal,
  });
}

/** LaTeX for unsaved edits: the whole file, the template preamble, and the editable body. */
export function resumeTeX(data: ResumeData, layout: Layout) {
  return api<{ tex: string; preamble: string; body: string }>('/api/resumes/tex', {
    method: 'POST',
    body: JSON.stringify({ data, layout }),
  });
}

/** Edited LaTeX back into a resume. */
export function parseResumeTeX(tex: string) {
  return api<{ data: ResumeData; warnings: string[] }>('/api/resumes/parse-tex', { method: 'POST', body: JSON.stringify({ tex }) });
}

/** Three stronger rewrites of a bullet ([placeholders] mark numbers to fill in). */
export function suggestBullet(text: string, role: string, jobId?: number | null) {
  return api<{ suggestions: string[] }>('/api/resumes/suggest-bullet', {
    method: 'POST',
    body: JSON.stringify({ text, role, job_id: jobId ?? 0 }),
  });
}
