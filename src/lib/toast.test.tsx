import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toast, Toasts } from './toast';

describe('toasts', () => {
  it('shows success and error messages and can dismiss them', async () => {
    render(<Toasts />);
    act(() => {
      toast.success('Letter saved.');
      toast.error('Could not save.');
    });
    expect(screen.getByText('Letter saved.')).toBeInTheDocument();
    expect(screen.getByText('Could not save.')).toBeInTheDocument();
    const close = screen.getAllByRole('button');
    await userEvent.click(close[0]!);
    expect(screen.queryByText('Letter saved.')).toBeNull();
  });
});
