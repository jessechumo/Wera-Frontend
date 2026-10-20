import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuthConfig, useAuthMutation, useMe } from '../api/auth';
import { errorOrNull } from '../api/client';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { ThemeToggle } from '../lib/theme';
import { Logo } from '../components/Logo';
import { INPUT_CLS } from '../lib/styles';
import { Field } from '../components/Field';

/** Login and signup share one card; `mode` picks the form. */
export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  useDocumentTitle(mode === 'login' ? 'Log in' : 'Sign up');
  const me = useMe();
  const auth = useAuthMutation(mode);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const mailEnabled = useAuthConfig().data?.mail_enabled ?? false;

  if (me.data) return <Navigate to={from} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    auth.mutate(
      { email, password, name: mode === 'signup' ? name : undefined },
      // New accounts go straight to profile setup.
      { onSuccess: () => void navigate(mode === 'signup' ? '/welcome' : from, { replace: true }) },
    );
  };
  const error =
    errorOrNull(auth.error);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-muted">
            {mode === 'login'
              ? 'Welcome back.'
              : 'Jobs from 3,000+ employers, from startups and hospitals to the Fortune 500, scored against your resume.'}
          </p>
        </div>
        <form
          onSubmit={submit}
          className="anim-rise space-y-4 rounded-card border border-border bg-surface p-5"
        >
          {mode === 'signup' && (
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className={INPUT_CLS}
                placeholder="Your name"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={INPUT_CLS}
              placeholder="you@example.com"
            />
          </Field>
          <Field
            label="Password"
            hint={mode === 'signup' ? 'At least 10 characters.' : undefined}
          >
            <input
              type="password"
              required
              minLength={mode === 'signup' ? 10 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={INPUT_CLS}
            />
          </Field>
          {mode === 'login' && mailEnabled && (
            <Link to="/forgot-password" className="-mt-2 block text-right text-[11px] text-muted hover:text-accent">Forgot password?</Link>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-xs text-bad">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={auth.isPending}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg transition-colors duration-150 hover:bg-accent/85 disabled:opacity-60"
          >
            {auth.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <Link to="/signup" className="font-medium text-accent hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-accent hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
