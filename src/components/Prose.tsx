import type { ReactNode } from 'react';

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|https:\/\/[^\s)]+)/g;

/** Bold, inline code and https links; everything else is plain text. */
function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.startsWith('https://'))
      return (
        <a key={i} href={part} target="_blank" rel="nofollow noopener noreferrer ugc" className="text-accent underline underline-offset-2">
          {part}
        </a>
      );
    return part;
  });
}

/**
 * Renders the small markdown subset posts use: paragraphs, ## headings,
 * "- " lists, **bold**, `code` and https links. No HTML is ever
 * interpreted; React escapes all text.
 */
export function Prose({ text, className }: { text: string; className?: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (/^#{1,3} /.test(b)) {
          return <h2 key={i} className="mt-7 mb-2 font-sans text-lg font-semibold text-text">{inline(b.replace(/^#{1,3} /, ''))}</h2>;
        }
        if (lines.every((l) => /^\s*[-*] /.test(l))) {
          return (
            <ul key={i} className="my-4 list-disc space-y-1.5 pl-6">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*] /, ''))}</li>)}
            </ul>
          );
        }
        return <p key={i} className="my-4 whitespace-pre-line">{inline(b)}</p>;
      })}
    </div>
  );
}
