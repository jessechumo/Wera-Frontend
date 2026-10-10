import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Prose } from './Prose';

describe('Prose', () => {
  it('renders the markdown subset', () => {
    const { container } = render(
      <Prose text={'## Prep\n\n- one **bold** item\n- `kubectl get pods`\n\nRead https://example.com/guide today.'} />,
    );
    expect(screen.getByRole('heading', { name: 'Prep' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('code')).toHaveTextContent('kubectl get pods');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/guide');
    expect(link).toHaveAttribute('rel', 'nofollow noopener noreferrer ugc');
  });

  it('never interprets HTML or unsafe links', () => {
    const { container } = render(
      <Prose text={'<img src=x onerror=alert(1)><script>alert(1)</script>\n\njavascript:alert(1) and http://plain.example.com'} />,
    );
    expect(container.querySelector('img, script')).toBeNull();
    expect(container).toHaveTextContent('<script>alert(1)</script>');
    expect(screen.queryByRole('link')).toBeNull();
  });
});
