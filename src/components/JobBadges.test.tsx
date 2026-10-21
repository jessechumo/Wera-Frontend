import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AutofilledBadge } from './JobBadges';

describe('AutofilledBadge', () => {
  it('marks a job the extension filled, saying when', () => {
    render(<AutofilledBadge at={new Date(Date.now() - 2 * 3600_000).toISOString()} />);
    expect(screen.getByText('Autofilled').closest('[title]')).toHaveAttribute('title', expect.stringContaining('Filled with the Wera extension'));
  });

  it('shows nothing for a job never filled', () => {
    const { container } = render(<AutofilledBadge at={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
