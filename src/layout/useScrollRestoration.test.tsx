import { useEffect } from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { useScrollRestoration } from './useScrollRestoration';

const ref: { nav?: ReturnType<typeof useNavigate> } = {};
function Probe() {
  useScrollRestoration();
  const navigate = useNavigate();
  useEffect(() => { ref.nav = navigate; }, [navigate]);
  return null;
}
const nav = (to: string | number, opts?: { replace?: boolean }) =>
  typeof to === 'number' ? ref.nav!(to) : ref.nav!(to, opts);

describe('useScrollRestoration', () => {
  it('starts new pages at the top, keeps the scroll for query changes, restores on back', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true });
    render(<MemoryRouter initialEntries={['/']}><Probe /></MemoryRouter>);

    Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    act(() => void nav('/jobs'));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);

    scrollTo.mockClear();
    act(() => void nav('/jobs?q=sre', { replace: true }));
    expect(scrollTo).not.toHaveBeenCalled();

    act(() => void nav(-1));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 1200);
  });
});
