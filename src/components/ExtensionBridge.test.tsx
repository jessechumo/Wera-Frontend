import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { announceChange } from '../lib/extension';
import { ExtensionBridge } from './ExtensionBridge';

function setup() {
  const qc = new QueryClient();
  const invalidate = vi.spyOn(qc, 'invalidateQueries');
  const posted: unknown[] = [];
  const spy = vi.spyOn(window, 'postMessage').mockImplementation((data: unknown) => void posted.push(data));
  render(
    <QueryClientProvider client={qc}>
      <ExtensionBridge />
      <a href="https://jobs.example/acme/123" data-wera-job="42" onClick={(e) => e.preventDefault()}>Open posting</a>
    </QueryClientProvider>,
  );
  return { invalidate, posted, spy };
}

afterEach(() => {
  delete document.documentElement.dataset.weraExtension;
});

describe('ExtensionBridge', () => {
  it('stays quiet without the extension', async () => {
    const { posted } = setup();
    await userEvent.click(screen.getByText('Open posting'));
    announceChange();
    expect(posted).toEqual([]);
  });

  it('tells the extension which job a posting link opens, and announces changes', async () => {
    document.documentElement.dataset.weraExtension = '0.3.0';
    const { posted } = setup();
    await userEvent.click(screen.getByText('Open posting'));
    announceChange('applicant');
    expect(posted).toEqual([
      { source: 'wera-dashboard', type: 'open-job', jobId: 42, url: 'https://jobs.example/acme/123' },
      { source: 'wera-dashboard', type: 'changed', what: 'applicant' },
    ]);
  });

  it('refetches when the extension changed something, ignoring other senders', async () => {
    vi.useFakeTimers();
    const { invalidate, spy } = setup();
    spy.mockRestore();
    const send = (data: unknown, origin = location.origin) => window.dispatchEvent(new MessageEvent('message', { data, origin, source: window }));
    send({ source: 'wera-extension', type: 'changed' }, 'https://evil.example');
    send({ source: 'not-wera', type: 'changed' });
    await vi.advanceTimersByTimeAsync(400);
    expect(invalidate).not.toHaveBeenCalled();
    send({ source: 'wera-extension', type: 'changed' });
    send({ source: 'wera-extension', type: 'changed' });
    await vi.advanceTimersByTimeAsync(400);
    expect(invalidate).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
