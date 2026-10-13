import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';

const WORDS = [
  'International Student', 'H-1B Sponsorship', 'AI Engineer', 'New Grad 2027', 'STEM OPT', 'Site Reliability',
  'Offer', 'Fit 94', 'Remote', 'Platform Engineer', 'Data Scientist', 'Return Offer', 'Referral', 'Cover Letter',
  'Green Card', 'Quant Researcher', 'Internship', 'Kubernetes', 'Product Manager', 'Hybrid', 'Series B', 'OPT',
  'Machine Learning', 'Backend', 'Interview Loop', 'Sponsors visas', 'Entry Level', 'Tailored Resume', 'Robotics',
  'Aerospace', 'Fintech', 'Day One CPT', 'Signing Bonus', 'Full-time', 'Applied', 'Strong Match', 'One Page',
];
// Some words glow in the accent color.
const ACCENT = new Set(['H-1B Sponsorship', 'Offer', 'Fit 94', 'International Student', 'Sponsors visas', 'Strong Match']);

function Row({ offset, reverse, size, speed }: { offset: number; reverse: boolean; size: string; speed: number }) {
  const words = [...WORDS.slice(offset), ...WORDS.slice(0, offset)];
  const line = (key: string) => (
    <span key={key} className="flex shrink-0 items-center gap-10 pr-10">
      {words.map((w, i) => (
        <span key={i} className={clsx('whitespace-nowrap', i % 3 === 1 ? 'font-mono tracking-tight' : 'font-semibold tracking-tight',
          ACCENT.has(w) ? 'text-accent brightness-125' : 'text-text')}>
          {w}
        </span>
      ))}
    </span>
  );
  return (
    <div className={clsx('flex w-max', size, reverse ? 'drift-right' : 'drift-left')} style={{ ['--drift' as string]: `${speed}s` }}>
      {line('a')}
      {line('b')}
    </div>
  );
}

/**
 * Paints where the words must stay out of the way: opaque everywhere except
 * a soft halo around each line of real text in the field, sized to that
 * text's font. Used as a mask layer, it fades the drifting words behind
 * anything being read while leaving them visible in the gaps.
 */
function keepClearMask(field: HTMLElement, words: HTMLElement): string | null {
  const box = field.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  // The mask is blurry by design, so a quarter-resolution canvas is plenty.
  const scale = 0.25;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(box.width * scale);
  canvas.height = Math.ceil(box.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-out';

  const walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      words.contains(n) || !n.textContent?.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const range = document.createRange();
  // Shadows instead of ctx.filter: the shape is drawn off-canvas and only
  // its blurred shadow lands, which every browser supports.
  const away = canvas.width + 1000;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const font = parseFloat(getComputedStyle(n.parentElement!).fontSize) || 16;
    const padX = font * 0.6, padY = font * 0.35;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = font * 1.1 * scale;
    ctx.shadowOffsetX = away;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width === 0) continue;
      const x = (r.left - box.left - padX) * scale, y = (r.top - box.top - padY) * scale;
      const w = (r.width + 2 * padX) * scale, h = (r.height + 2 * padY) * scale;
      ctx.beginPath();
      ctx.roundRect(x - away, y, w, h, h / 2);
      ctx.fill();
    }
  }
  return canvas.toDataURL();
}

/**
 * A plain field (black in dark mode, near white in light) hiding rows of
 * job-search words; a soft spotlight follows the pointer and reveals them
 * only there, and they fade out around the text in front so it stays
 * readable. Decorative: hidden from assistive tech.
 */
export function RevealField({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = 0, y = 0, tx = 0, ty = 0, frame = 0;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = () => {
      // Ease toward the pointer for a calm, trailing light.
      x += (tx - x) * (smooth ? 0.16 : 1);
      y += (ty - y) * (smooth ? 0.16 : 1);
      el.style.setProperty('--reveal-x', `${x}px`);
      el.style.setProperty('--reveal-y', `${y}px`);
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!el.classList.contains('is-active')) {
        x = tx;
        y = ty;
        el.classList.add('is-active');
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const leave = () => el.classList.remove('is-active');
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointercancel', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', leave);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Keep the keep-clear mask in step with the layout: size changes, fonts
  // arriving, live numbers filling in, and entrance animations settling.
  useEffect(() => {
    const el = ref.current, words = wordsRef.current;
    if (!el || !words) return;
    let timer = 0;
    const redraw = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const url = keepClearMask(el, words);
        if (url) words.style.setProperty('--keep-clear', `url(${url})`);
      }, 60);
    };
    redraw();
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(redraw);
    resize?.observe(el);
    const mutate = new MutationObserver((records) => {
      if (records.some((r) => !words.contains(r.target))) redraw();
    });
    mutate.observe(el, { childList: true, characterData: true, subtree: true });
    el.addEventListener('animationend', redraw);
    void document.fonts?.ready.then(redraw);
    return () => {
      window.clearTimeout(timer);
      resize?.disconnect();
      mutate.disconnect();
      el.removeEventListener('animationend', redraw);
    };
  }, []);

  return (
    <div ref={ref} className={clsx('reveal-field relative isolate overflow-hidden bg-bg', className)}>
      <div ref={wordsRef} aria-hidden className="reveal-words pointer-events-none absolute inset-0 -z-10 flex flex-col justify-center gap-7 opacity-[0.32] select-none">
        {Array.from({ length: 11 }, (_, i) => (
          <Row key={i} offset={(i * 7) % WORDS.length} reverse={i % 2 === 1}
            size={i % 3 === 0 ? 'text-3xl' : i % 3 === 1 ? 'text-xl' : 'text-2xl'} speed={110 + (i % 4) * 25} />
        ))}
      </div>
      {children}
    </div>
  );
}
