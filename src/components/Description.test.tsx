import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Description } from './Description';

describe('Description', () => {
  it('turns plain posting text into headings, lists and paragraphs', () => {
    render(
      <Description
        text={'About the role\n\nYou will keep our systems reliable and fast for millions of users.\n\n- Go\n- Kubernetes\n\nApply at https://example.com/apply.'}
      />,
    );
    expect(screen.getByRole('heading', { name: 'About the role' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Go', 'Kubernetes']);
    expect(screen.getByText(/keep our systems reliable/)).toBeInTheDocument();
  });
});
