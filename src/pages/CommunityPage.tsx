import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { MessageCircle, PenSquare, Users } from 'lucide-react';
import { usePosts } from '../api/community';
import { Avatar } from '../components/Avatar';
import { Reactions } from '../components/Reactions';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
import { relTime } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function CommunityPage() {
  useDocumentTitle('Community');
  const [sp, setSp] = useSearchParams();
  const tag = sp.get('tag') ?? '';
  const feed = usePosts(tag);

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">Community</h1>
          <p className="mt-1 max-w-lg text-sm text-muted">
            Offers, interview trends and hard-won tips from people in the same search. Every post is reviewed before it
            goes live.
          </p>
        </div>
        <Link
          to="/community/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent/85"
        >
          <PenSquare className="size-4" /> Write a post
        </Link>
      </header>

      {!!feed.data?.tags.length && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {[{ tag: '', count: 0 }, ...feed.data.tags].map((t) => (
            <button
              key={t.tag || 'all'}
              onClick={() => setSp(t.tag ? { tag: t.tag } : {})}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150',
                tag === t.tag ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border text-muted hover:text-text',
              )}
            >
              {t.tag ? `#${t.tag}` : 'All posts'}
              {t.count > 0 && <span className="ml-1 text-faint">{t.count}</span>}
            </button>
          ))}
        </div>
      )}

      {feed.isLoading ? (
        <SkeletonRows rows={4} />
      ) : feed.error ? (
        <ErrorState message={String(feed.error)} onRetry={() => void feed.refetch()} />
      ) : !feed.data?.posts.length ? (
        <EmptyState
          icon={<Users className="size-6 text-faint" />}
          title={tag ? `No posts tagged #${tag} yet` : 'No posts yet'}
          hint="Landed an offer or learned something in an interview loop? Be the first to share it."
        />
      ) : (
        <ul className="space-y-3">
          {feed.data.posts.map((p, i) => (
            <li key={p.id} className="anim-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <Link
                to={`/community/${p.id}`}
                className="group block rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-px hover:border-accent/30 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                  <Avatar user={p.author} size={22} self={false} />
                  <span className="font-medium text-text">{p.author.name}</span>
                  <span className="text-faint">· {relTime(p.created_at)} · {p.read_minutes} min read</span>
                </div>
                <h2 className="font-serif text-xl leading-snug font-semibold text-text transition-colors group-hover:text-accent">
                  {p.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{p.excerpt.replace(/[#*`]/g, '')}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {p.tags.map((t) => (
                    <span key={t} className="text-xs text-faint">#{t}</span>
                  ))}
                  <span className="ml-auto flex items-center gap-3">
                    <Reactions post={p} compact />
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <MessageCircle className="size-3.5" /> {p.comment_count}
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
