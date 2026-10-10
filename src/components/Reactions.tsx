import clsx from 'clsx';
import { Heart, Lightbulb, PartyPopper } from 'lucide-react';
import { useReact, type PostSummary, type ReactionKind } from '../api/community';

const KINDS: { kind: ReactionKind; label: string; Icon: typeof Heart; on: string }[] = [
  { kind: 'like', label: 'Like', Icon: Heart, on: 'text-rose-500 border-rose-400/40 bg-rose-500/10' },
  { kind: 'insightful', label: 'Insightful', Icon: Lightbulb, on: 'text-amber-500 border-amber-400/40 bg-amber-500/10' },
  { kind: 'celebrate', label: 'Celebrate', Icon: PartyPopper, on: 'text-violet-500 border-violet-400/40 bg-violet-500/10' },
];

/** The three reactions with counts; click to toggle yours. */
export function Reactions({ post, compact }: { post: PostSummary; compact?: boolean }) {
  const react = useReact(post.id);
  return (
    <div className="flex flex-wrap gap-1.5">
      {KINDS.map(({ kind, label, Icon, on }) => {
        const mine = post.my_reactions.includes(kind);
        const n = post.reactions[kind] ?? 0;
        if (compact && n === 0) return null;
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={mine}
            aria-label={`${label} (${n})`}
            title={label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              react.mutate({ kind, on: !mine });
            }}
            className={clsx(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums transition-all duration-200 active:scale-95',
              mine ? on : 'border-border text-muted hover:border-accent/30 hover:text-text',
            )}
          >
            <Icon className={clsx('size-3.5 transition-transform duration-300', mine && 'scale-110')} fill={mine && kind === 'like' ? 'currentColor' : 'none'} />
            {n > 0 && n}
            {!compact && n === 0 && <span className="sr-only sm:not-sr-only">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
