import { act, screen, waitFor } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubApi } from '../test/fixtures';
import { jsonResponse, renderApp } from '../test/render';
import { useJobs } from '../api/hooks';
import { ConnectionBanner } from './ConnectionBanner';

const HEALTHY = { status: 'ok', version: 'test', commit: 'abc' };

function Jobs() {
  const jobs = useJobs({});
  return <p>{jobs.error ? 'jobs failed' : jobs.data ? `${jobs.data.jobs.length} jobs` : 'loading'}</p>;
}

describe('ConnectionBanner', () => {
  afterEach(() => {
    vi.useRealTimers();
    onlineManager.setOnline(true);
  });

  it('stays out of the way while the server answers', async () => {
    const fetched = vi.fn(() => HEALTHY);
    stubApi({ 'GET /healthz': fetched });
    renderApp(<ConnectionBanner />);
    await waitFor(() => expect(fetched).toHaveBeenCalled());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('says so when the server stops answering, then recovers every failed view by itself', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let up = false;
    stubApi({
      'GET /healthz': () => (up ? HEALTHY : jsonResponse(530, { error: 'tunnel down' })),
      'GET /api/jobs': () => (up ? { jobs: [{ id: 1 }], count: 1 } : jsonResponse(530, { error: 'tunnel down' })),
    });
    renderApp(<><ConnectionBanner /><Jobs /></>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument(); // one failed look is a blip
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/isn't answering/);
    expect(await screen.findByText('jobs failed')).toBeInTheDocument();

    up = true;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(await screen.findByText('1 jobs')).toBeInTheDocument();
  });

  it('tells the difference when it is this device that is offline', async () => {
    stubApi({ 'GET /healthz': () => HEALTHY });
    renderApp(<ConnectionBanner />);
    act(() => onlineManager.setOnline(false));
    expect(await screen.findByRole('status')).toHaveTextContent(/You're offline/);
    act(() => onlineManager.setOnline(true));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });
});
