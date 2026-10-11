import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Check, LoaderCircle, X } from 'lucide-react';
import { resumeThumbnails, useTemplates, type Layout, type ResumeData, type TemplateId } from '../api/resumes';
import { ACCENTS } from './edit';


const ATS_LABEL: Record<string, string> = { best: 'ATS: best', excellent: 'ATS: excellent' };

function Thumb({ svg, name }: { svg?: string; name: string }) {
  const url = useMemo(() => (svg ? URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })) : ''), [svg]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  if (!url) return <div className="skeleton aspect-[8.5/11] w-full" />;
  return <img src={url} alt={`Your resume in ${name}`} className="block aspect-[8.5/11] w-full bg-white object-cover object-top" draggable={false} />;
}

/** Choose a template, seeing your own resume in each; plus accent and paper. */
export function TemplatePicker({ data, layout, onChange, onClose }: {
  data: ResumeData; layout: Layout; onChange: (l: Layout) => void; onClose: () => void;
}) {
  const templates = useTemplates();
  const [thumbs, setThumbs] = useState<Partial<Record<TemplateId, string>>>({});
  const [error, setError] = useState('');
  const accent = layout.accent ?? '#1d4ed8';
  // Thumbnails follow the accent and paper (and the content at open time).
  const key = `${accent}|${layout.paper ?? 'us-letter'}`;
  useEffect(() => {
    const c = new AbortController();
    resumeThumbnails(data, layout, c.signal)
      .then((r) => setThumbs(r.thumbnails))
      .catch(() => !c.signal.aborted && setError('Could not render the previews.'));
    return () => c.abort();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps -- re-render only when the look changes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const current = layout.template ?? 'ivy';
  const list = templates.data?.templates ?? [];
  const usesAccent = list.find((t) => t.id === current)?.uses_accent;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Choose a template"
        className="anim-rise relative w-full max-w-5xl rounded-card border border-border bg-bg p-5 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div>
            <h2 className="text-lg font-semibold">Templates</h2>
            <p className="text-xs text-muted">Your resume in each design. Every one is a single column that applicant tracking systems read cleanly.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="ml-auto rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text"><X className="size-4" /></button>
        </div>
        {error && <p className="mb-3 text-xs text-bad">{error}</p>}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {list.map((t) => {
            const active = t.id === current;
            return (
              <button key={t.id} type="button" onClick={() => onChange({ ...layout, template: t.id })} aria-pressed={active}
                className={clsx('group flex flex-col overflow-hidden rounded-xl border-2 bg-surface text-left transition-all',
                  active ? 'border-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent)_15%,transparent)]' : 'border-border hover:border-accent/50')}>
                <div className="relative border-b border-border">
                  <Thumb svg={thumbs[t.id]} name={t.name} />
                  {active && <span className="absolute top-2 right-2 rounded-full bg-accent p-1 text-bg"><Check className="size-3.5" /></span>}
                </div>
                <div className="p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-[10px] font-medium text-good">{ATS_LABEL[t.ats] ?? ''}</span>
                  </div>
                  <div className="text-xs font-medium text-accent">{t.tagline}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{t.description}</p>
                </div>
              </button>
            );
          })}
          {!list.length && Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton aspect-[8.5/13] w-full" />)}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border pt-4">
          <div className={clsx('flex items-center gap-2', !usesAccent && 'opacity-50')}>
            <span className="text-xs text-muted">Accent</span>
            {ACCENTS.map((a) => (
              <button key={a.hex} type="button" onClick={() => onChange({ ...layout, accent: a.hex })} disabled={!usesAccent}
                aria-label={a.name} title={usesAccent ? a.name : 'This template is black and white'} aria-pressed={accent === a.hex}
                className={clsx('size-6 rounded-full ring-offset-2 ring-offset-bg transition-transform hover:scale-110', accent === a.hex && 'ring-2 ring-text')}
                style={{ background: a.hex }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Paper</span>
            {(['us-letter', 'a4'] as const).map((p) => (
              <button key={p} type="button" onClick={() => onChange({ ...layout, paper: p })} aria-pressed={(layout.paper ?? 'us-letter') === p}
                className={clsx('rounded-lg border px-2.5 py-1 text-xs font-medium',
                  (layout.paper ?? 'us-letter') === p ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border text-muted hover:text-text')}>
                {p === 'a4' ? 'A4' : 'US Letter'}
              </button>
            ))}
          </div>
          {Object.keys(thumbs).length < list.length && !error && <LoaderCircle className="size-4 animate-spin text-faint" aria-label="Rendering previews" />}
          <button onClick={onClose} className="ml-auto rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent/85">Done</button>
        </div>
      </div>
    </div>
  );
}
