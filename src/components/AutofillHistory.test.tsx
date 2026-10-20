import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { stubApi } from '../test/fixtures';
import { renderApp } from '../test/render';
import { AutofillHistory } from './AutofillHistory';

describe('AutofillHistory', () => {
  it('lists what the extension filled for the job', async () => {
    stubApi({
      'GET /api/autofill-runs': () => ({ runs: [{ id: 1, job_id: 5, host: 'boards.greenhouse.io', pages: 3, filled: 24, suggested: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] }),
    });
    renderApp(<AutofillHistory jobId={5} />);
    expect(await screen.findByText('boards.greenhouse.io')).toBeInTheDocument();
    expect(screen.getByText(/3 pages, 24 fields filled \(2 by AI\)/)).toBeInTheDocument();
  });

  it('hints at the extension when it is installed, and stays out of the way when not', async () => {
    stubApi();
    const { unmount } = renderApp(<AutofillHistory jobId={5} />);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText(/Autofill/)).toBeNull();
    unmount();
    document.documentElement.dataset.weraExtension = '0.3.0';
    renderApp(<AutofillHistory jobId={5} />);
    expect(await screen.findByText(/use the Wera button/)).toBeInTheDocument();
    delete document.documentElement.dataset.weraExtension;
  });
});
