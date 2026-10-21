import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { applicant, stubApi } from '../test/fixtures';
import { renderApp, jsonBody } from '../test/render';
import { Toasts } from '../lib/toast';
import { ApplicationDetails } from './ApplicationDetails';

describe('ApplicationDetails', () => {
  it('fills only blanks from the resume, then saves', async () => {
    let saved: Record<string, string> | null = null;
    stubApi({
      'POST /api/applicant/suggest': () => ({ suggestions: { phone: '(512) 555-0142', school: 'UT Austin', current_title: 'Should not overwrite' } }),
      'PUT /api/applicant': (init) => {
        saved = jsonBody(init);
        return { applicant: saved, saved: true };
      },
    });
    renderApp(<><ApplicationDetails /><Toasts /></>);
    await userEvent.click(await screen.findByRole('button', { name: /Fill blanks from my resume/ }));
    await waitFor(() => expect(screen.getByLabelText('Phone')).toHaveValue('(512) 555-0142'));
    expect(screen.getByLabelText('School')).toHaveValue('UT Austin');
    expect(screen.getByLabelText('Current or last title')).toHaveValue('SRE intern');
    expect(await screen.findByText(/Filled 2 fields from your resume/)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Willing to relocate'), 'no');
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() => expect(saved).not.toBeNull());
    expect(saved).toMatchObject({ ...applicant, phone: '(512) 555-0142', school: 'UT Austin', willing_to_relocate: 'no' });
  });

  it('asks the newer eligibility and self-identification questions', async () => {
    let saved: Record<string, string> | null = null;
    stubApi({ 'PUT /api/applicant': (init) => ((saved = jsonBody(init)), { applicant: saved, saved: true }) });
    renderApp(<><ApplicationDetails /><Toasts /></>);
    await userEvent.selectOptions(await screen.findByLabelText('At least 18 years old'), 'yes');
    await userEvent.type(screen.getByLabelText(/Security clearance/), 'None');
    await userEvent.selectOptions(screen.getByLabelText('Preferred work arrangement'), 'hybrid');
    await userEvent.selectOptions(screen.getByLabelText('Transgender'), 'decline');
    await userEvent.selectOptions(screen.getByLabelText('Sexual orientation'), 'Bisexual');
    expect(screen.getByText(/never to the AI/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() => expect(saved).toMatchObject({ over_18: 'yes', security_clearance: 'None', work_preference: 'hybrid', transgender: 'decline', sexual_orientation: 'Bisexual' }));
  });

  it('marks details filled in from the resume and profile, and lists the jobs and schools it reads', async () => {
    stubApi({
      'GET /api/applicant': () => ({
        applicant: { ...applicant, school: 'UT Dallas', degree: 'Master of Science' }, saved: false,
        sources: { school: 'resume', degree: 'resume', current_title: 'profile' },
        experience: [{ title: 'Data Scientist', company: 'Globex', start: '2024-06', current: true, location: 'Dallas, TX' }],
        education: [{ school: 'UT Dallas', degree: 'Master of Science', major: 'Business Analytics', end: '2024-05', gpa: '3.9' }],
      }),
    });
    renderApp(<ApplicationDetails />);
    expect(await screen.findByLabelText('School')).toHaveValue('UT Dallas');
    expect(screen.getAllByText('from your resume')).toHaveLength(2);
    expect(screen.getByText('from your profile')).toBeInTheDocument();
    expect(screen.getByText('Data Scientist, Globex')).toBeInTheDocument();
    expect(screen.getByText(/Jun 2024 – Present/)).toBeInTheDocument();
    expect(screen.getByText(/Master of Science, Business Analytics · May 2024 · GPA 3.9/)).toBeInTheDocument();
    // Edited, it is the user's own.
    await userEvent.clear(screen.getByLabelText('School'));
    await userEvent.type(screen.getByLabelText('School'), 'SMU');
    expect(screen.getAllByText('from your resume')).toHaveLength(1);
  });
});
