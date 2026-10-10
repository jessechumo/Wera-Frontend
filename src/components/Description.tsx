/**
 * Renders a plain-text job description: blocks are separated by blank
 * lines; a short block without closing punctuation reads as a heading; a
 * block of several lines (or lines starting with a bullet) reads as a
 * list. Job boards differ wildly, so this stays heuristic and never drops
 * text.
 */
export function Description({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-[13.5px] leading-relaxed text-muted">
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.replace(/^[-•*·▪●]\s*/, '').trim());
        const bulleted = /^[-•*·▪●]\s/.test(block);
        if (lines.length === 1 && !bulleted && isHeading(lines[0]!, blocks[i + 1])) {
          return (
            <h4 key={i} className="pt-2 text-sm font-semibold text-text first:pt-0">
              {lines[0]}
            </h4>
          );
        }
        if (lines.length > 1 || bulleted) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[9px] size-1 shrink-0 rounded-full bg-faint" />
                  <span>
                    <Linkify text={l} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            <Linkify text={lines[0]!} />
          </p>
        );
      })}
    </div>
  );
}

function isHeading(line: string, next: string | undefined): boolean {
  return next != null && line.length <= 60 && !/[.;,!?)]$/.test(line) && line.split(' ').length <= 8;
}

const URL_RE = /(https?:\/\/[^\s)]+[^\s).,;:!?'"])/g;

/** Turns bare http(s) URLs into links that open in a new tab. */
function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={p}
            target="_blank"
            rel="noreferrer"
            className="break-all text-accent-2 underline-offset-2 hover:underline"
          >
            {p.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        ) : (
          p
        ),
      )}
    </>
  );
}
