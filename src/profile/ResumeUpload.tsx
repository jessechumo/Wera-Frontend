import { useRef, useState } from 'react';
import { FileText, LoaderCircle, Upload } from 'lucide-react';
import clsx from 'clsx';
import { useUploadResume } from '../api/profile';
import { ApiError } from '../api/client';
import { INPUT_CLS } from '../auth/AuthPage';

/** Upload a resume PDF (drag and drop or pick), or paste its text. */
export function ResumeUpload({
  resumeChars,
  onUploaded,
}: {
  resumeChars: number;
  onUploaded?: (chars: number) => void;
}) {
  const upload = useUploadResume();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const send = (v: { file: File } | { text: string }) =>
    upload.mutate(v, {
      onSuccess: (r) => {
        setPreview(r.preview);
        setPasting(false);
        onUploaded?.(r.resume_chars);
      },
    });
  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (f) send({ file: f });
  };
  const error =
    upload.error instanceof ApiError ? upload.error.message : upload.error ? 'Upload failed' : null;

  return (
    <div className="space-y-3">
      {pasting ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste your resume text here…"
            className={clsx(INPUT_CLS, 'font-mono text-xs')}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={upload.isPending || text.trim().length < 50}
              onClick={() => send({ text })}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg disabled:opacity-50"
            >
              {upload.isPending ? 'Saving…' : 'Use this text'}
            </button>
            <button
              type="button"
              onClick={() => setPasting(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-text"
            >
              Upload a PDF instead
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files);
          }}
          className={clsx(
            'flex flex-col items-center gap-2 rounded-card border border-dashed px-6 py-8 text-center transition-colors duration-150',
            drag ? 'border-accent bg-accent/5' : 'border-border bg-surface-2/40',
          )}
        >
          {upload.isPending ? (
            <LoaderCircle className="size-6 animate-spin text-accent" />
          ) : (
            <Upload className="size-6 text-faint" />
          )}
          <div className="text-sm text-text">
            {upload.isPending ? 'Reading your resume…' : 'Drop your resume PDF here'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={upload.isPending}
              onClick={() => input.current?.click()}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:border-accent/40"
            >
              Choose file
            </button>
            <button
              type="button"
              onClick={() => setPasting(true)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-text"
            >
              Paste text instead
            </button>
          </div>
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => pick(e.target.files)}
          />
          <div className="text-[11px] text-faint">PDF, up to 5 MB. Only the text is kept.</div>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-xs text-bad">
          {error}
        </p>
      )}
      {(preview || resumeChars > 0) && !upload.isPending && (
        <div className="flex items-start gap-2 rounded-lg border border-good/25 bg-good/5 px-3 py-2 text-xs">
          <FileText className="mt-0.5 size-3.5 shrink-0 text-good" />
          <div className="min-w-0">
            <div className="font-medium text-text">
              Resume on file
              {resumeChars > 0 && !preview && (
                <span className="text-faint"> · {resumeChars.toLocaleString()} characters</span>
              )}
            </div>
            {preview && (
              <div className="mt-1 line-clamp-3 whitespace-pre-line text-muted">{preview}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
