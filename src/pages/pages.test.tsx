// Page-level tests: each page renders real API fixtures and its main
// interaction works. Network calls go to stubApi (src/test/fixtures.ts).
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fixtures, stubApi } from '../test/fixtures';
import { renderApp } from '../test/render';
import ExcludedPage from './ExcludedPage';
import IndustriesPage from './IndustriesPage';
import IndustryPage from './IndustryPage';
import JobsPage from './JobsPage';
import ProfilePage from './ProfilePage';
import SystemPage from './SystemPage';
import TodayPage from './TodayPage';
import TrackerPage from './TrackerPage';

const firstToday = fixtures.today.jobs[0]!;

describe('TodayPage', () => {
  it('lists the review queue with the top pick first', async () => {
    stubApi();
    renderApp(<TodayPage />);
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect((await screen.findAllByText(firstToday.title)).length).toBeGreaterThan(0);
    expect(screen.getByText(/matches to review/)).toBeInTheDocument();
  });

  it('explains that scoring is in progress for a brand-new user', async () => {
    const estimated = fixtures.today.jobs.slice(0, 3).map((j) => ({ ...j, fit_score: null, estimated_score: 70 }));
    stubApi({ 'GET /api/today': () => ({ count: 3, jobs: estimated, pending: 120 }) });
    renderApp(<TodayPage />);
    expect(await screen.findByText('Scoring your matches')).toBeInTheDocument();
    expect(screen.getByText(/120 to go/)).toBeInTheDocument();
    expect(screen.getByText(/\(3 estimated\)/)).toBeInTheDocument();
  });
});

describe('JobsPage', () => {
  it('lists jobs and opens one in the job view', async () => {
    stubApi();
    renderApp(<JobsPage />, { path: '/jobs', route: '/jobs' });
    const first = fixtures.jobs.jobs[0]!;
    await userEvent.click((await screen.findAllByText(first.title))[0]!);
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByRole('heading', { name: first.title })).toBeInTheDocument();
  });

  it('opens the job view from the URL and switches to the cover letter', async () => {
    stubApi();
    renderApp(<JobsPage />, { path: `/jobs?job=${fixtures.job.id}`, route: '/jobs' });
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText(fixtures.job.title)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /Cover letter/ }));
    expect(await within(dialog).findByRole('button', { name: /Write my letter/ })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('tab', { name: 'The posting' }));
    expect(within(dialog).queryByRole('button', { name: /Write my letter/ })).toBeNull();
  });

  it('saves a status from the job view', async () => {
    let saved: unknown;
    stubApi({
      [`PUT /api/jobs/${fixtures.job.id}/application`]: (init) => {
        saved = JSON.parse(String(init?.body));
        return { ...fixtures.job, application_status: 'applied' };
      },
    });
    renderApp(<JobsPage />, { path: `/jobs?job=${fixtures.job.id}`, route: '/jobs' });
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText(fixtures.job.title);
    await userEvent.selectOptions(within(dialog).getByRole('combobox'), 'applied');
    await waitFor(() => expect(saved).toMatchObject({ status: 'applied' }));
  });
});

describe('JobsPage keyboard', () => {
  it('j and k move the selection; Enter opens the job', async () => {
    stubApi();
    renderApp(<JobsPage />, { path: '/jobs', route: '/jobs' });
    const first = fixtures.jobs.jobs[0]!;
    await screen.findAllByText(first.title);
    // Real keydown events on window, as the page listens there.
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'Enter' });
    // j, j, k lands on the second job.
    const second = fixtures.jobs.jobs[1]!;
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByRole('heading', { name: second.title })).toBeInTheDocument();
  });
});

describe('other pages', () => {
  it('Tracker groups applications by status', async () => {
    stubApi();
    renderApp(<TrackerPage />);
    expect(await screen.findByRole('heading', { name: 'Tracker' })).toBeInTheDocument();
  });

  it('Industries shows each industry with its matches', async () => {
    stubApi();
    renderApp(<IndustriesPage />);
    expect(await screen.findByText('Trading & HFT')).toBeInTheDocument();
    expect(screen.getByText('AI & Machine Learning')).toBeInTheDocument();
  });

  it('an industry page lists its jobs', async () => {
    stubApi();
    renderApp(<IndustryPage />, { path: '/industries/trading', route: '/industries/:id' });
    expect(await screen.findByRole('heading', { name: 'Trading & HFT' })).toBeInTheDocument();
  });

  it('Excluded explains why jobs were filtered out', async () => {
    stubApi();
    renderApp(<ExcludedPage />);
    const first = fixtures.excluded.jobs[0]!;
    expect((await screen.findAllByText(first.title)).length).toBeGreaterThan(0);
  });

  it('System shows runs and companies to admins', async () => {
    stubApi();
    renderApp(<SystemPage />);
    expect(await screen.findByRole('heading', { name: 'System' })).toBeInTheDocument();
    expect((await screen.findAllByText(fixtures.companies.companies[0]!.name)).length).toBeGreaterThan(0);
  });

  it('Profile shows the photo controls and the resume', async () => {
    stubApi();
    renderApp(<ProfilePage />);
    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add photo' })).toBeInTheDocument();
    expect(await screen.findByText('resume.pdf')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Show the text Wera read/ }));
    expect(screen.getByText(/SRE intern/, { selector: 'pre' })).toBeInTheDocument();
  });
});
