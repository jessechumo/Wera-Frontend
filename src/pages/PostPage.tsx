import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LoaderCircle, Trash2 } from 'lucide-react';
import { useMe } from '../api/auth';
import { ApiError } from '../api/client';
import { useComment, useDeleteComment, useDeletePost, usePost } from '../api/community';
import { Avatar } from '../components/Avatar';
import { Prose } from '../components/Prose';
import { Reactions } from '../components/Reactions';
import { ErrorState, Skeleton } from '../components/States';
import { absTime, relTime } from '../lib/format';
import { toast } from '../lib/toast';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Network error';
}

function CommentBox({ postId }: { postId: number }) {
  const me = useMe();
  const comment = useComment(postId);
  const [body, setBody] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        comment.mutate(body.trim(), { onSuccess: () => setBody('') });
      }}
      className="flex gap-3"
    >
      {me.data && <Avatar user={me.data} size={32} />}
      <div className="flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={body ? 3 : 1}
          maxLength={2000}
          placeholder="Add a thoughtful comment…"
          aria-label="Comment"
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text transition-all duration-200 placeholder:text-faint focus:border-accent/60 focus:outline-none"
        />
        {comment.error && <p className="mt-1 text-xs text-bad">{errorText(comment.error)}</p>}
        {body.trim() && (
          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="text-[11px] text-faint">Reviewed before posting</span>
            <button
              type="submit"
              disabled={comment.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg disabled:opacity-60"
            >
              {comment.isPending && <LoaderCircle className="size-3.5 animate-spin" />} Comment
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

export default function PostPage() {
  const id = Number(useParams().id);
  const post = usePost(id);
  const del = useDeletePost();
  const delComment = useDeleteComment(id);
  const navigate = useNavigate();
  useDocumentTitle(post.data?.title ?? 'Community');

  if (post.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (post.error) {
    return <ErrorState message={post.error instanceof ApiError && post.error.status === 404 ? 'This post is no longer available.' : String(post.error)} />;
  }
  const p = post.data!;

  return (
    <article className="mx-auto max-w-2xl pb-16">
      <Link to="/community" className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text">
        <ArrowLeft className="size-3.5" /> Community
      </Link>
      <h1 className="font-serif text-[34px] leading-tight font-semibold tracking-tight text-text">{p.title}</h1>
      <div className="mt-4 flex items-center gap-3 border-b border-border pb-5">
        <Avatar user={p.author} size={40} self={false} />
        <div className="text-sm">
          <div className="font-medium text-text">{p.author.name}</div>
          <div className="text-xs text-faint" title={absTime(p.created_at)}>
            {relTime(p.created_at)} · {p.read_minutes} min read
          </div>
        </div>
        {p.is_mine && (
          <button
            onClick={() => {
              if (!window.confirm('Delete this post?')) return;
              del.mutate(p.id, {
                onSuccess: () => {
                  toast.success('Post deleted.');
                  navigate('/community');
                },
              });
            }}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:text-bad"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        )}
      </div>

      <Prose text={p.body} className="font-serif text-[17px] leading-[1.75] text-text/90" />

      {p.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {p.tags.map((t) => (
            <Link key={t} to={`/community?tag=${t}`} className="rounded-full bg-surface-2 px-3 py-1 text-xs text-muted hover:text-text">
              #{t}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6 border-y border-border py-4">
        <Reactions post={p} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold text-text">
          {p.comments.length ? `${p.comments.length} comment${p.comments.length === 1 ? '' : 's'}` : 'Comments'}
        </h2>
        <CommentBox postId={p.id} />
        <ul className="mt-6 space-y-5">
          {p.comments.map((c) => (
            <li key={c.id} className="group flex gap-3 anim-rise">
              <Avatar user={c.author} size={32} self={false} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-text">{c.author.name}</span>
                  <span className="text-faint">{relTime(c.created_at)}</span>
                  {c.is_mine && (
                    <button
                      onClick={() => delComment.mutate(c.id)}
                      aria-label="Delete comment"
                      className="ml-auto text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-bad focus-visible:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-text/90">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
