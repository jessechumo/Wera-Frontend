import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Boom({ fail }: { fail: boolean }) {
  if (fail) throw new Error('kaboom');
  return <p>fine</p>;
}

describe('ErrorBoundary', () => {
  it('shows the error instead of a blank page, and clears when the key changes', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <Boom fail />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/kaboom/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKey="/b">
        <Boom fail={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('fine')).toBeInTheDocument();
    spy.mockRestore();
  });
});
