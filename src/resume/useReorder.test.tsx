import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { move } from './edit';
import { useReorder } from './useReorder';

function List() {
  const [items, setItems] = useState(['a', 'b', 'c']);
  const dnd = useReorder('t', (from, to) => setItems((xs) => move(xs, from, to)));
  return (
    <ul>
      {items.map((x, i) => (
        <li key={x} {...dnd.target(i)}><span {...dnd.handle(i)}>drag {x}</span></li>
      ))}
    </ul>
  );
}

describe('useReorder', () => {
  it('moves a dragged row onto the row it is dropped on', () => {
    render(<List />);
    const store: Record<string, string> = {};
    const dataTransfer = {
      types: ['application/x-wera-t'], effectAllowed: '',
      setData: (k: string, v: string) => { store[k] = v; }, getData: (k: string) => store[k] ?? '',
    };
    fireEvent.dragStart(screen.getByText('drag a'), { dataTransfer });
    fireEvent.dragOver(screen.getByText('drag c').closest('li')!, { dataTransfer });
    fireEvent.drop(screen.getByText('drag c').closest('li')!, { dataTransfer });
    expect(screen.getAllByText(/drag/).map((e) => e.textContent)).toEqual(['drag b', 'drag c', 'drag a']);
  });
});
