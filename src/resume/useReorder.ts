import { useState, type DragEvent } from 'react';

/**
 * Drag-and-drop reordering for one list. Spread `handle(i)` on the drag
 * handle and `target(i)` on each row; `over` is the row being hovered.
 * (Keyboard users keep the move up/down buttons.)
 */
export function useReorder(scope: string, onMove: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const mime = `application/x-wera-${scope}`;
  const end = () => {
    setDrag(null);
    setOver(null);
  };
  return {
    over,
    dragging: drag,
    handle: (i: number) => ({
      draggable: true,
      onDragStart: (e: DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData(mime, String(i));
        setDrag(i);
      },
      onDragEnd: end,
    }),
    target: (i: number) => ({
      onDragOver: (e: DragEvent) => {
        if (!e.dataTransfer.types.includes(mime)) return;
        e.preventDefault();
        e.stopPropagation();
        if (over !== i) setOver(i);
      },
      onDrop: (e: DragEvent) => {
        if (!e.dataTransfer.types.includes(mime)) return;
        e.preventDefault();
        e.stopPropagation();
        const from = Number(e.dataTransfer.getData(mime));
        end();
        if (Number.isFinite(from) && from !== i) onMove(from, i);
      },
    }),
  };
}
