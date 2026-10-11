import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-react';
import type { useLivePreview } from './useLivePreview';

function PageImage({ svg, n }: { svg: string; n: number }) {
  // A blob URL in an <img>: the SVG is displayed, never executed.
  const url = useMemo(() => URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), [svg]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt={`Resume page ${n}`} className="block w-full bg-white" draggable={false} />;
}

/** The rendered pages on paper, with a one-page indicator. */
export function ResumePreview({ pages, measure, loading, error }: ReturnType<typeof useLivePreview>) {
  const onePage = measure ? measure.pages <= 1 : null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        {onePage == null ? (
          <span className="text-faint">Rendering…</span>
        ) : onePage ? (
          <span className="inline-flex items-center gap-1 font-medium text-good"><CheckCircle2 className="size-3.5" /> One page</span>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium text-warn"><AlertTriangle className="size-3.5" /> {measure!.pages} pages: fit it to one</span>
        )}
        {measure && (
          <span className="flex items-center gap-1.5 text-faint" title="How full the last page is">
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
              <span className={clsx('block h-full rounded-full', onePage ? 'bg-good' : 'bg-warn')} style={{ width: `${Math.round(measure.fill * 100)}%` }} />
            </span>
            {Math.round(measure.fill * 100)}%
          </span>
        )}
        {loading && <LoaderCircle className="ml-auto size-3.5 animate-spin text-faint" aria-label="Updating preview" />}
      </div>
      {error && <p className="text-xs text-bad">{error}</p>}
      <div className={clsx('space-y-3 transition-opacity duration-200', loading && pages.length > 0 && 'opacity-70')}>
        {pages.length === 0 ? (
          <div className="skeleton aspect-[8.5/11] w-full" />
        ) : (
          pages.map((p, i) => (
            <div key={i} className="overflow-hidden rounded-sm shadow-[0_1px_3px_rgb(0_0_0/0.12),0_8px_24px_-12px_rgb(0_0_0/0.25)] ring-1 ring-black/5">
              <PageImage svg={p} n={i + 1} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
