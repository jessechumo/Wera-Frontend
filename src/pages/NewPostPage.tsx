import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, LoaderCircle, PenLine, ShieldCheck } from 'lucide-react';
import { ApiError } from '../api/client';
import { useCreatePost } from '../api/community';
import { Prose } from '../components/Prose';
import { toast } from '../lib/toast';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const SUGGESTED = ['offers', 'interviews', 'resume', 'networking', 'new-grad', 'visa', 'big-tech', 'startups'];

export default function NewPostPage() {
  useDocumentTitle('Write a post');
  const create = useCreatePost();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const err = create.error instanceof ApiError ? create.error.message : create.error ? 'Network error' : null;

  const submit = () =>
    create.mutate(
      { title: title.trim(), body: body.trim(), tags },
      {
        onSuccess: (p) => {
          toast.success('Published.');
          navigate(`/community/${p.id}`);
        },
      },
    );

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <Link to="/community" className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text">
        <ArrowLeft className="size-3.5" /> Community
      </Link>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={140}
        placeholder="Title"
        aria-label="Title"
        className="w-full bg-transparent font-serif text-[32px] leading-tight font-semibold text-text placeholder:text-faint/70 focus:outline-none"
      />
      <div className="mt-3 mb-2 flex items-center gap-1 border-b border-border">
        {[
          { on: false, label: 'Write', Icon: PenLine },
          { on: true, label: 'Preview', Icon: Eye },
        ].map(({ on, label, Icon }) => (
          <button
            key={label}
            onClick={() => setPreview(on)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              preview === on ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-faint tabular-nums">{words} words</span>
      </div>
      {preview ? (
        <Prose text={body || '_Nothing to preview yet._'} className="min-h-[320px] font-serif text-[17px] leading-[1.75] text-text/90" />
      ) : (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          maxLength={20000}
          placeholder={'Share what worked: the process, the questions, what you would do differently.\n\nFormatting: ## heading, - list item, **bold**, `code`.'}
          aria-label="Post body"
          className="w-full resize-y bg-transparent py-3 font-serif text-[17px] leading-[1.75] text-text placeholder:font-sans placeholder:text-sm placeholder:text-faint focus:outline-none"
        />
      )}

      <div className="mt-4">
        <div className="mb-2 text-xs font-medium text-muted">Tags (up to 5)</div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED.map((t) => {
            const on = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => setTags(on ? tags.filter((x) => x !== t) : tags.length < 5 ? [...tags, t] : tags)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  on ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border text-muted hover:text-text'
                }`}
              >
                #{t}
              </button>
            );
          })}
        </div>
      </div>

      {err && (
        <div role="alert" className="mt-5 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-text">
          <div className="font-medium text-bad">Not published</div>
          <p className="mt-0.5 text-muted">{err}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <span className="inline-flex items-center gap-1.5 text-xs text-faint">
          <ShieldCheck className="size-3.5" /> Posts are reviewed for safety and relevance before they go live.
        </span>
        <button
          onClick={submit}
          disabled={create.isPending || title.trim().length < 8 || body.trim().length < 200}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent/85 disabled:opacity-50"
        >
          {create.isPending && <LoaderCircle className="size-4 animate-spin" />}
          {create.isPending ? 'Reviewing…' : 'Publish'}
        </button>
      </div>
      {body.trim().length > 0 && body.trim().length < 200 && (
        <p className="mt-2 text-right text-[11px] text-faint">{200 - body.trim().length} more characters to publish</p>
      )}
    </div>
  );
}
