import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Monitor, Send, Smartphone } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { relTime } from '../lib/format';
import { toast } from '../lib/toast';

interface Overview {
  config: { enabled: boolean; provider?: string; from?: string; public_url?: string };
  templates: string[];
  outbox: { id: number; to: string; tag: string; subject: string; status: string; attempts: number; last_error: string | null; created_at: string; sent_at: string | null }[];
}

const LABEL: Record<string, string> = {
  verify: 'Confirm email', reset: 'Password reset', welcome: 'Welcome', digest: 'Daily digest', match: 'Strong match', test: 'Setup test',
};
const STATUS: Record<string, string> = { sent: 'text-good', failed: 'text-bad', queued: 'text-warn', sending: 'text-accent' };

/** Admin: email setup, a preview of every template, and the outbox. */
export function EmailAdmin() {
  const q = useQuery({ queryKey: ['admin-email'], queryFn: () => api<Overview>('/api/admin/email') });
  const [name, setName] = useState('verify');
  const [width, setWidth] = useState<'desktop' | 'phone'>('desktop');
  const [format, setFormat] = useState<'html' | 'text'>('html');
  const [text, setText] = useState('');
  const [to, setTo] = useState('');
  const test = useMutation({
    mutationFn: () => api<{ queued_to: string }>('/api/admin/email/test', { method: 'POST', body: JSON.stringify({ to }) }),
    onSuccess: (r) => { toast.success(`Test queued to ${r.queued_to}.`); void q.refetch(); },
    onError: (e) => toast.error(errorMessage(e, 'Could not send')),
  });
  useEffect(() => {
    if (format !== 'text') return;
    let live = true;
    fetch(`/api/admin/email/preview/${name}?format=text`, { credentials: 'same-origin' })
      .then((r) => r.text())
      .then((t) => live && setText(t))
      .catch(() => live && setText('Could not load the text version.'));
    return () => { live = false; };
  }, [name, format]);

  const cfg = q.data?.config;
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-text">Email</h3>
        {cfg && (
          <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-medium', cfg.enabled ? 'bg-good/10 text-good' : 'bg-surface-2 text-muted')}>
            {cfg.enabled ? `On · ${cfg.provider} · ${cfg.from}` : 'Off: set MAIL_PROVIDER to turn it on'}
          </span>
        )}
        {cfg?.enabled && (
          <form className="ml-auto flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); test.mutate(); }}>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" aria-label="Test recipient"
              className="w-48 rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs" />
            <button type="submit" disabled={test.isPending} className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-bg disabled:opacity-60">
              <Send className="size-3" /> Send test
            </button>
          </form>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {(q.data?.templates ?? []).map((t) => (
          <button key={t} type="button" onClick={() => setName(t)} aria-pressed={name === t}
            className={clsx('rounded-full border px-2.5 py-1 text-xs font-medium', name === t ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border text-muted hover:text-text')}>
            {LABEL[t] ?? t}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1">
          {(['html', 'text'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFormat(f)} aria-pressed={format === f}
              className={clsx('rounded-md px-2 py-1 text-[11px] font-medium', format === f ? 'bg-surface-2 text-text' : 'text-muted')}>{f === 'html' ? 'HTML' : 'Text'}</button>
          ))}
          <button type="button" onClick={() => setWidth('desktop')} aria-label="Desktop width" className={clsx('rounded-md p-1', width === 'desktop' ? 'text-accent' : 'text-faint')}><Monitor className="size-4" /></button>
          <button type="button" onClick={() => setWidth('phone')} aria-label="Phone width" className={clsx('rounded-md p-1', width === 'phone' ? 'text-accent' : 'text-faint')}><Smartphone className="size-4" /></button>
        </span>
      </div>
      <div className="mt-3 flex justify-center overflow-hidden rounded-lg border border-border bg-[#f4f2ee]">
        {format === 'html' ? (
          // Sandboxed: the email cannot run scripts or reach the dashboard.
          <iframe key={name} title={`${LABEL[name] ?? name} email preview`} src={`/api/admin/email/preview/${name}`} sandbox=""
            className={clsx('h-[640px] border-0 bg-white transition-[width] duration-200', width === 'phone' ? 'w-[390px]' : 'w-full')} />
        ) : (
          <pre className="h-[640px] w-full overflow-auto bg-surface p-4 font-mono text-xs whitespace-pre-wrap text-text">{text}</pre>
        )}
      </div>
      <p className="mt-2 text-[11px] text-faint">The digest preview uses your own matches from the last week when there are any.</p>
      {!!q.data?.outbox.length && (
        <div className="mt-4">
          <h4 className="mb-1.5 text-[11px] font-semibold tracking-wide text-faint uppercase">Outbox</h4>
          <ul className="divide-y divide-border text-xs">
            {q.data.outbox.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-1.5">
                <span className={clsx('w-14 font-medium', STATUS[m.status])}>{m.status}</span>
                <span className="w-28 truncate text-muted">{LABEL[m.tag] ?? m.tag}</span>
                <span className="min-w-0 flex-1 truncate" title={m.last_error ?? m.subject}>{m.to} · {m.subject}</span>
                <span className="text-faint">{relTime(m.sent_at ?? m.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
