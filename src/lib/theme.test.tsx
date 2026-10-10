import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeChoice, ThemeToggle } from './theme';

describe('theme', () => {
  it('the toggle switches between sun and moon and remembers the choice', async () => {
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('wera-theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });

  it('can be positioned by the caller (no built-in relative positioning)', () => {
    render(<ThemeToggle className="absolute top-4 right-4" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('absolute');
    expect(button.className.split(' ')).not.toContain('relative');
  });

  it('the settings control offers light, dark and system', async () => {
    render(<ThemeChoice />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.textContent?.trim())).toEqual(['Light', 'Dark', 'Match system']);
    await userEvent.click(screen.getByRole('radio', { name: /Dark/ }));
    expect(localStorage.getItem('wera-theme')).toBe('dark');
    expect(screen.getByRole('radio', { name: /Dark/ })).toHaveAttribute('aria-checked', 'true');
  });
});
