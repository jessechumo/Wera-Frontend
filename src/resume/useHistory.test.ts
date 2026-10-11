import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHistory } from './useHistory';

describe('useHistory', () => {
  afterEach(() => vi.useRealTimers());
  it('merges quick changes, undoes and redoes', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHistory('a', 500));
    act(() => result.current.set('ab'));
    act(() => result.current.set('abc')); // typed quickly: same step
    vi.advanceTimersByTime(1000);
    act(() => result.current.set('abcd'));
    act(() => result.current.undo());
    expect(result.current.value).toBe('abc');
    act(() => result.current.undo());
    expect(result.current.value).toBe('a');
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.redo());
    expect(result.current.value).toBe('abc');
    act(() => result.current.set('x'));
    expect(result.current.canRedo).toBe(false);
  });
});
