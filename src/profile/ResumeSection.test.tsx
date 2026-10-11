import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ResumeDoc } from '../api/resumes';
import type { JobDetail } from '../api/types';
import { JobResumePanel } from '../components/JobResumePanel';
import { stubApi } from '../test/fixtures';
import { renderApp } from '../test/render';
import { ResumeSection } from './ResumeSection';

const doc = (over: Partial<ResumeDoc> = {}): ResumeDoc => ({
  id: 3, title: 'My resume', job_id: null, job_title: null, job_company: null, notes: [], updated_at: '2026-10-10T00:00:00Z',
  layout: { font_size: 11, spacing: 1, margin: 0.5 }, fit: null,
  data: {
    name: 'Ada Lovelace', email: 'ada@example.com',
    sections: [{ id: 's1', kind: 'entries', title: 'Experience', entries: [{ id: 'e1', heading: 'Engines Inc', subheading: 'SRE', dates: '2025',
      bullets: [{ id: 'b1', text: 'Cut deploy time by 50%' }, { id: 'b2', text: 'Ran on-call', hidden: true }] }] }],
  },
  ...over,
});
const preview = () => ({ pages: ['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], measure: { pages: 1, fill: 0.8 } });

describe('ResumeSection', () => {
  it('imports a LaTeX resume on first visit', async () => {
    let imported: Record<string, unknown> = {};
    let resumes: unknown[] = [];
    stubApi({
      'GET /api/profile': () => ({ resume_chars: 0 }),
      'GET /api/resumes': () => ({ resumes }),
      'POST /api/resumes/import': (init) => {
        imported = JSON.parse(String(init?.body));
        resumes = [{ id: 3, title: 'My resume', job_id: null }];
        return doc();
      },
      'GET /api/resumes/3': () => doc(),
      'POST /api/resumes/preview': preview,
    });
    renderApp(<ResumeSection />, { path: '/profile/resume', route: '/profile/resume/:id?' });
    const box = await screen.findByLabelText('LaTeX source');
    await userEvent.click(box);
    await userEvent.paste('\\begin{document}{\\Huge \\scshape Ada}\\end{document}');
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => expect(imported).toMatchObject({ source: 'tex', replace: false }));
  });

  it('builds the resume from the uploaded one on first open', async () => {
    let body: Record<string, unknown> = {};
    let resumes: unknown[] = [];
    stubApi({
      'GET /api/profile': () => ({ resume_chars: 900, resume_file: { filename: 'Ada_CV.pdf', uploaded_at: '2026-10-01T00:00:00Z' } }),
      'GET /api/resumes': () => ({ resumes }),
      'POST /api/resumes/import': (init) => {
        body = JSON.parse(String(init?.body));
        resumes = [{ id: 3, title: 'My resume', job_id: null }];
        return doc();
      },
      'GET /api/resumes/3': () => doc(),
      'POST /api/resumes/preview': preview,
    });
    renderApp(<ResumeSection />, { path: '/profile/resume', route: '/profile/resume/:id?' });
    expect(await screen.findByText(/Building your resume from Ada_CV.pdf/)).toBeInTheDocument();
    await waitFor(() => expect(body).toEqual({ source: 'profile' }));
    expect(await screen.findByLabelText('Name')).toHaveValue('Ada Lovelace');
  });

  it('edits with autosave, shows hidden items, previews and fits', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const saves: { data: { name: string } }[] = [];
    let fitted = false;
    stubApi({
      'GET /api/profile': () => ({ resume_chars: 900 }),
      'GET /api/resumes': () => ({ resumes: [{ id: 3, title: 'My resume', job_id: null }] }),
      'GET /api/resumes/3': () => doc(),
      'PUT /api/resumes/3': (init) => {
        const body = JSON.parse(String(init?.body));
        saves.push(body);
        return doc({ data: body.data, updated_at: `2026-10-10T00:00:0${saves.length}Z` });
      },
      'POST /api/resumes/preview': preview,
      'POST /api/resumes/3/fit': () => ((fitted = true), doc({ fit: { layout: { font_size: 10.5, spacing: 0.9, margin: 0.45 }, hidden: [], before: { pages: 2, fill: 0.2 }, after: { pages: 1, fill: 0.97 }, one_page: true, summary: 'Fits on one page at 10.5pt with tighter spacing' } })),
    });
    renderApp(<ResumeSection />, { path: '/profile/resume', route: '/profile/resume/:id?' });
    const name = await screen.findByLabelText('Name');
    expect(await screen.findByAltText('Resume page 1')).toBeInTheDocument();
    expect(screen.getByText('One page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show 1 hidden/ })).toBeInTheDocument();

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.clear(name);
    await user.type(name, 'Ada King');
    expect(screen.getByText(/Unsaved/)).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    await waitFor(() => expect(saves.at(-1)?.data.name).toBe('Ada King'));
    expect(saves).toHaveLength(1); // one save for the burst of typing

    await user.click(screen.getByRole('button', { name: /Fit to one page/ }));
    await waitFor(() => expect(fitted).toBe(true));
    vi.useRealTimers();
  });
});

describe('JobResumePanel', () => {
  const job = { id: 12, company: 'Acme', title: 'SRE' } as JobDetail;

  it('asks to set up a resume first', async () => {
    stubApi({ 'GET /api/jobs/12/keywords': () => ({ keywords: ['Go'], coverage: null, resume_id: null }), 'GET /api/jobs/12/resume': () => new Response('{}', { status: 404 }) });
    renderApp(<JobResumePanel job={job} />);
    expect(await screen.findByRole('link', { name: 'Set up my resume' })).toHaveAttribute('href', '/profile/resume');
  });

  it('shows keyword coverage and tailors a copy', async () => {
    let tailored: ResumeDoc | null = null;
    stubApi({
      'GET /api/jobs/12/keywords': () => ({ keywords: ['Go', 'Rust'], coverage: { matched: ['Go'], missing: ['Rust'], percent: 50 }, resume_id: 3 }),
      'GET /api/jobs/12/resume': () => tailored ?? new Response('{}', { status: 404 }),
      'POST /api/jobs/12/resume': () => {
        tailored = doc({ id: 9, job_id: 12, job_title: 'SRE', job_company: 'Acme', notes: ['Led with Go'] });
        return { resume: tailored, coverage_before: { matched: [], missing: ['Go', 'Rust'], percent: 0 } };
      },
      'POST /api/resumes/preview': preview,
    });
    renderApp(<JobResumePanel job={job} />);
    expect(await screen.findByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Tailor my resume/ }));
    expect(await screen.findByText('Led with Go')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Edit/ })).toHaveAttribute('href', '/profile/resume/9');
    expect(screen.getByRole('link', { name: /PDF/ })).toHaveAttribute('href', '/api/resumes/9/pdf?download=1');
  });
});
