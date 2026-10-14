import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleAlert, LoaderCircle, MailCheck } from 'lucide-react';
import { forgotPassword, resetPassword, verifyEmail } from '../api/auth';
import { errorMessage } from '../api/client';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../lib/theme';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { Field } from '../components/Field';
import { INPUT_CLS } from '../lib/styles';


function Card({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo size="lg" />
        </div>
        <div className="anim-rise space-y-4 rounded-card border border-border bg-surface p-5">
          <div>
            <h1 className="text-base font-semibold">{title}</h1>
            {lead && <p className="mt-1 text-xs leading-relaxed text-muted">{lead}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'good' | 'bad'; children: ReactNode }) {
  return (
    <p role={tone === 'bad' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${tone === 'good' ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`}>
      {tone === 'good' ? <CheckCircle2 className="mt-px size-3.5 shrink-0" /> : <CircleAlert className="mt-px size-3.5 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

const PRIMARY = 'inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent/85 disabled:opacity-60';

/** /verify-email?token=…: the link in the confirmation email. */
export function VerifyEmailPage() {
  useDocumentTitle('Confirm your email');
  const token = useSearchParams()[0].get('token') ?? '';
  const [state, setState] = useState<{ status: 'working' | 'done' | 'failed'; text: string }>(() =>
    token ? { status: 'working', text: '' } : { status: 'failed', text: 'This link is incomplete. Open it from the email again.' });
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !token) return; // a link works once: never post it twice
    sent.current = true;
    verifyEmail(token)
      .then((r) => setState({ status: 'done', text: r.email }))
      .catch((e) => setState({ status: 'failed', text: errorMessage(e) }));
  }, [token]);
  return (
    <Card title="Confirm your email">
      {state.status === 'working' ? (
        <p className="flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" /> Confirming…</p>
      ) : state.status === 'done' ? (
        <>
          <p className="flex items-center gap-2 text-sm"><MailCheck className="size-5 text-good" /> <span><b>{state.text}</b> is confirmed.</span></p>
          <Link to="/" className={PRIMARY}><ArrowRight className="size-4" /> Go to Wera</Link>
        </>
      ) : (
        <>
          <Notice tone="bad">{state.text}</Notice>
          <p className="text-xs text-muted">Signed in? Send a new link from <Link to="/settings" className="text-accent hover:underline">Settings</Link>.</p>
        </>
      )}
    </Card>
  );
}

/** /forgot-password: ask for a reset link. */
export function ForgotPasswordPage() {
  useDocumentTitle('Reset your password');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<{ busy: boolean; done: string; error: string }>({ busy: false, done: '', error: '' });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setState({ busy: true, done: '', error: '' });
    forgotPassword(email)
      .then((r) => setState({ busy: false, done: r.message, error: '' }))
      .catch((err) => setState({ busy: false, done: '', error: errorMessage(err) }));
  };
  return (
    <Card title="Reset your password" lead="Enter the email you sign in with and we will send a link to choose a new password.">
      {state.done ? (
        <>
          <Notice tone="good">{state.done} It works for an hour; check spam if it does not arrive.</Notice>
          <Link to="/login" className="block text-center text-xs font-medium text-accent hover:underline">Back to log in</Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={INPUT_CLS} placeholder="you@example.com" />
          </Field>
          {state.error && <Notice tone="bad">{state.error}</Notice>}
          <button type="submit" disabled={state.busy} className={PRIMARY}>
            {state.busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Send the link
          </button>
          <Link to="/login" className="block text-center text-xs text-muted hover:text-text">Back to log in</Link>
        </form>
      )}
    </Card>
  );
}

/** /reset-password?token=…: choose a new password. */
export function ResetPasswordPage() {
  useDocumentTitle('Choose a new password');
  const token = useSearchParams()[0].get('token') ?? '';
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [state, setState] = useState<{ busy: boolean; done: boolean; error: string }>({ busy: false, done: false, error: '' });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pw !== again) {
      setState({ busy: false, done: false, error: 'The two passwords differ.' });
      return;
    }
    setState({ busy: true, done: false, error: '' });
    resetPassword(token, pw)
      .then(() => setState({ busy: false, done: true, error: '' }))
      .catch((err) => setState({ busy: false, done: false, error: errorMessage(err) }));
  };
  if (!token) {
    return <Card title="Choose a new password"><Notice tone="bad">This link is incomplete. Open it from the email again, or <Link to="/forgot-password" className="underline">ask for a new one</Link>.</Notice></Card>;
  }
  return (
    <Card title="Choose a new password" lead="You will be signed out everywhere else, including the Chrome extension.">
      {state.done ? (
        <>
          <Notice tone="good">Your password is changed.</Notice>
          <Link to="/login" className={PRIMARY}><ArrowRight className="size-4" /> Log in</Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" hint="At least 10 characters.">
            <input type="password" required minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className={INPUT_CLS} />
          </Field>
          <Field label="Again">
            <input type="password" required minLength={10} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" className={INPUT_CLS} />
          </Field>
          {state.error && <Notice tone="bad">{state.error}{/expired|invalid/.test(state.error) && <> <Link to="/forgot-password" className="underline">Ask for a new link</Link>.</>}</Notice>}
          <button type="submit" disabled={state.busy} className={PRIMARY}>
            {state.busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Change password
          </button>
        </form>
      )}
    </Card>
  );
}
