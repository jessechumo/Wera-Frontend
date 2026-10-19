import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Layout, ResumeData, ResumeDoc } from '../api/resumes';
import { stubApi } from '../test/fixtures';
import { renderApp, jsonBody } from '../test/render';
import { Workspace } from './Workspace';

const data = (): ResumeData => ({
  name: 'Ada Lovelace', email: 'ada@example.com',
  sections: [{ id: 's1', kind: 'entries', title: 'Experience', entries: [{ id: 'e1', heading: 'Engines Inc', subheading: 'SRE', dates: '2025',
    bullets: [{ id: 'b1', text: 'Responsible for the deploy pipeline' }, { id: 'b2', text: 'Cut deploy time by 50% across 12 services' }] }] }],
});
const doc = (over: Partial<ResumeDoc> = {}): ResumeDoc => ({
  id: 3, title: 'My resume', job_id: null, job_title: null, job_company: null, notes: [], updated_at: '2026-10-11T00:00:00Z',
  layout: { font_size: 11, spacing: 1, margin: 0.5, template: 'ivy', accent: '#1d4ed8', paper: 'us-letter' }, fit: null, data: data(), ...over,
});
const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
const templates = {
  templates: [
    { id: 'ivy', name: 'Ivy', tagline: 'The classic tech resume', description: 'Classic.', uses_accent: false, ats: 'excellent' },
    { id: 'parse', name: 'Parse', tagline: 'ATS-maxxing', description: 'Plain.', uses_accent: false, ats: 'best' },
    { id: 'signal', name: 'Signal', tagline: 'Modern', description: 'Accent.', uses_accent: true, ats: 'excellent' },
  ],
  default_accent: '#1d4ed8',
};

function server() {
  const saves: { data: ResumeData; layout: Layout }[] = [];
  const previews: ResumeData[] = [];
  stubApi({
    'GET /api/resumes/templates': () => templates,
    'POST /api/resumes/preview': (init) => {
      previews.push(jsonBody<{ data: ResumeData }>(init).data);
      return {
        pages: [svg], measure: { pages: 1, fill: 0.8 },
        review: { score: 88, checks: [{ id: 'weak-opener', severity: 'improve', target: 'b1', message: 'Starts with "Responsible for".' }] },
      };
    },
    'POST /api/resumes/thumbnails': () => ({ thumbnails: { ivy: svg, parse: svg, signal: svg } }),
    'PUT /api/resumes/3': (init) => {
      const body = jsonBody<{ data: ResumeData; layout: Layout }>(init);
      saves.push(body);
      return doc({ data: body.data, layout: body.layout, updated_at: `2026-10-11T00:00:0${saves.length}Z` });
    },
    'POST /api/resumes/tex': () => ({ tex: 'PRE\\begin{document}BODY', preamble: '\\documentclass{article}\n% Ivy\n', body: '\\resumeHeader{Ada Lovelace}{}{}' }),
    'POST /api/resumes/parse-tex': (init) => {
      const { tex } = jsonBody<{ tex: string }>(init);
      return { data: { ...data(), name: tex.includes('Ada King') ? 'Ada King' : 'Ada Lovelace' }, warnings: [] };
    },
    'POST /api/resumes/suggest-bullet': () => ({ suggestions: ['Owned the deploy pipeline, cutting release time by [X]%', 'Ran deploys for 12 services'] }),
  });
  return { saves, previews };
}

describe('resume workspace', () => {
  it('switches template and accent, and saves them', async () => {
    const { saves } = server();
    renderApp(<Workspace doc={doc()} />);
    await userEvent.click(await screen.findByRole('button', { name: /Template/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Choose a template' });
    expect(await within(dialog).findAllByAltText(/Your resume in/)).toHaveLength(3);
    await userEvent.click(within(dialog).getByRole('button', { name: /Signal/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Teal' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'A4' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(saves.at(-1)?.layout).toMatchObject({ template: 'signal', accent: '#0f766e', paper: 'a4' }), { timeout: 3000 });
  });

  it('shows review findings in place and jumps to them', async () => {
    server();
    renderApp(<Workspace doc={doc()} />);
    expect(await screen.findByText(/Starts with "Responsible for"/)).toBeInTheDocument(); // inline in the form
    await userEvent.click(screen.getByRole('button', { name: /Resume review: 88/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Starts with "Responsible for"/ }));
    await waitFor(() => expect(screen.getByLabelText('Bullet 1')).toHaveFocus());
  });

  it('applies an AI suggestion and undoes it', async () => {
    const { saves } = server();
    renderApp(<Workspace doc={doc()} />);
    const bullet = await screen.findByLabelText('Bullet 1');
    const row = bullet.closest('[id]') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Suggest stronger versions' }));
    const pick = await screen.findByRole('button', { name: /Owned the deploy pipeline/ });
    expect(within(pick).getByText('[X]')).toBeInTheDocument(); // the placeholder is highlighted
    await userEvent.click(pick);
    expect(screen.getByLabelText('Bullet 1')).toHaveValue('Owned the deploy pipeline, cutting release time by [X]%');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Bullet 1')).toHaveValue('Responsible for the deploy pipeline');
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(screen.getByLabelText('Bullet 1')).toHaveValue('Owned the deploy pipeline, cutting release time by [X]%');
    await waitFor(() => expect(saves.at(-1)?.data.sections[0]!.entries![0]!.bullets![0]!.text).toMatch(/^Owned/), { timeout: 3000 });
  });

  it('edits the LaTeX, previews it, and applies it', async () => {
    const { previews, saves } = server();
    renderApp(<Workspace doc={doc()} />);
    await userEvent.click(await screen.findByRole('tab', { name: /LaTeX/ }));
    const editor = await screen.findByLabelText('LaTeX');
    expect(editor).toHaveValue('\\resumeHeader{Ada Lovelace}{}{}');
    fireEvent.change(editor, { target: { value: '\\resumeHeader{Ada King}{}{}' } });
    expect(await screen.findByText(/Read cleanly/, {}, { timeout: 3000 })).toBeInTheDocument();
    await waitFor(() => expect(previews.at(-1)?.name).toBe('Ada King'), { timeout: 3000 }); // the preview follows the LaTeX
    expect(screen.getByText('Showing your LaTeX edits')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Apply to resume/ }));
    await waitFor(() => expect(saves.at(-1)?.data.name).toBe('Ada King'), { timeout: 3000 });
    await userEvent.click(screen.getByRole('tab', { name: /Edit/ }));
    expect(screen.getByLabelText('Name')).toHaveValue('Ada King');
  });
});
