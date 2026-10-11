import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DayBars, StatTile } from './StatTile';

describe('DayBars', () => {
  it('draws one labelled bar per day, zero days as a faint tick', () => {
    const { container } = render(
      <DayBars data={[{ day: '2026-10-08', count: 47 }, { day: '2026-10-09', count: 0 }, { day: '2026-10-10', count: 30 }]} />,
    );
    const bars = container.querySelectorAll('rect');
    expect(bars).toHaveLength(3);
    expect([...bars].map((b) => b.querySelector('title')?.textContent)).toEqual([
      'Oct 8: 47 new matches', 'Oct 9: 0 new matches', 'Oct 10: 30 new matches',
    ]);
    expect(bars[1]!.getAttribute('height')).toBe('2');
    expect(bars[2]!.getAttribute('opacity')).toBe('1'); // today stands out
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('Oct 10: 30'));
  });

  it('is omitted with fewer than two days', () => {
    const { container } = render(<StatTile label="New today" value={3} bars={[{ day: '2026-10-10', count: 3 }]} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
