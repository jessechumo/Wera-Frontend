import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const positions = new Map<string, number>();

/**
 * Page-level scroll behavior for the app shell: a new page starts at the
 * top, Back and Forward return to where you were. Changes to the query
 * string alone (filters, an opened job) keep the scroll as it is.
 */
export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const lastPath = useRef(location.pathname);
  const lastKey = useRef(location.key);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const save = () => positions.set(lastKey.current, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);

  useLayoutEffect(() => {
    if (location.pathname === lastPath.current) {
      lastKey.current = location.key;
      return;
    }
    lastPath.current = location.pathname;
    lastKey.current = location.key;
    const saved = navType === 'POP' ? positions.get(location.key) : undefined;
    if (saved == null) {
      window.scrollTo(0, 0);
      return;
    }
    // The page may still be loading: try for a moment until it is tall enough.
    let tries = 0;
    let frame = 0;
    const restore = () => {
      if (document.documentElement.scrollHeight - window.innerHeight >= saved || tries++ > 30) window.scrollTo(0, saved);
      else frame = requestAnimationFrame(restore);
    };
    restore();
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.key, navType]);
}
