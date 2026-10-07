import { useEffect } from 'react';

/** Sets the browser tab title: "Jobs · wera". */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · wera`;
  }, [title]);
}
