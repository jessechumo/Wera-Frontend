import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { stubApi } from '../test/fixtures';
import { renderApp } from '../test/render';
import { AddJobDialog } from './AddJobDialog';

const posting = 'About the role: keep our robot fleet online. '.repeat(8);

describe('AddJobDialog', () => {
  it('fills the form from the pasted posting and adds the job', async () => {
    let sent: Record<string, string> = {};
    stubApi({
      'GET /api/industries': () => ({ industries: [{ id: 'robotics', label: 'Robotics' }] }),
      'POST /api/ext/extract': () => ({
        is_job_posting: true, company: 'Acme Robotics', title: 'Site Reliability Engineer', location: 'Austin, TX',
        work_mode: 'onsite', industry: 'robotics', description: 'About the role: keep our robot fleet online.',
      }),
      'POST /api/jobs': (init) => {
        sent = JSON.parse(String(init?.body));
        return { id: 77, title: sent.title, company: sent.company };
      },
    });
    const onAdded = vi.fn();
    renderApp(<AddJobDialog onClose={() => {}} onAdded={onAdded} />);
    await userEvent.type(screen.getByLabelText('Link to the posting'), 'https://acme.example/careers/42');
    await userEvent.click(screen.getByLabelText(/Posting text/));
    await userEvent.paste(posting);
    await userEvent.type(screen.getByLabelText('Title'), 'SRE II');
    await userEvent.click(screen.getByRole('button', { name: /Fill from the posting/ }));
    await waitFor(() => expect(screen.getByLabelText('Company')).toHaveValue('Acme Robotics'));
    // What was typed by hand is kept.
    expect(screen.getByLabelText('Title')).toHaveValue('SRE II');
    expect(screen.getByLabelText('Industry')).toHaveValue('robotics');

    await userEvent.click(screen.getByRole('button', { name: 'Add job' }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledWith(77));
    expect(sent).toMatchObject({ url: 'https://acme.example/careers/42', company: 'Acme Robotics', title: 'SRE II', work_mode: 'onsite' });
  });

  it('closes on Escape', async () => {
    stubApi({ 'GET /api/industries': () => ({ industries: [] }) });
    const onClose = vi.fn();
    renderApp(<AddJobDialog onClose={onClose} onAdded={() => {}} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
