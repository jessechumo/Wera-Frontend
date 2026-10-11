import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { industryIcon } from '../lib/industryIcons';

const SIZES = {
  xs: { tile: 'size-4 rounded', icon: 'size-3' },
  sm: { tile: 'size-8 rounded-lg', icon: 'size-4' },
  md: { tile: 'size-10 rounded-xl', icon: 'size-5' },
  lg: { tile: 'size-12 rounded-2xl', icon: 'size-6' },
};

/** The industry's icon on a tile tinted with its color (decorative: the label says the name). */
export function IndustryIcon({ id, size = 'md', className, bare = false }: { id: string; size?: keyof typeof SIZES; className?: string; bare?: boolean }) {
  const { icon: Icon, color: base } = industryIcon(id);
  // A little toward the text color: darker on light cards, lighter on dark ones.
  const color = `color-mix(in oklab, ${base} 80%, var(--color-text))`;
  const s = SIZES[size];
  if (bare) return <Icon aria-hidden className={clsx(s.icon, 'shrink-0', className)} style={{ color }} strokeWidth={2} />;
  return (
    <span aria-hidden
      className={clsx('inline-flex shrink-0 items-center justify-center ring-1 ring-inset', s.tile, className)}
      style={{
        color,
        background: `color-mix(in oklab, ${base} 13%, transparent)`,
        '--tw-ring-color': `color-mix(in oklab, ${base} 22%, transparent)`,
      } as CSSProperties}>
      <Icon className={s.icon} strokeWidth={1.9} />
    </span>
  );
}
