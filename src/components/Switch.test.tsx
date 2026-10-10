import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('is an accessible switch that reports the new value', async () => {
    const onChange = vi.fn();
    render(<Switch label="Match digest" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Match digest' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
