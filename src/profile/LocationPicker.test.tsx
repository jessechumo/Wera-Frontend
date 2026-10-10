import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { LocationPicker } from './LocationPicker';

function Harness() {
  const [v, setV] = useState<string[]>([]);
  return (
    <>
      <LocationPicker value={v} onChange={setV} />
      <output>{v.join('|')}</output>
    </>
  );
}

describe('LocationPicker', () => {
  it('suggests places as you type and picks with the keyboard', async () => {
    render(<Harness />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'Seat');
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Seattle');
    await userEvent.keyboard('{Enter}');
    expect(document.querySelector('output')).toHaveTextContent('Seattle, WA');
  });
});
