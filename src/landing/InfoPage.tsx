import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../lib/theme';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { INFO_PAGES } from './infoPages';
import { SiteFooter } from './SiteFooter';

export default function InfoPage({ page }: { page: keyof typeof INFO_PAGES }) {
  const { title, blurb } = INFO_PAGES[page];
  useDocumentTitle(`${title} · Wera`);
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <header className="border-b border-border">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Wera home"><Logo /></Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="rounded-lg px-2 py-2 text-sm font-medium text-muted hover:text-text sm:px-3">Log in</Link>
            <Link to="/signup" className="rounded-lg bg-text px-3.5 py-2 text-sm font-semibold text-bg hover:opacity-90">Get started</Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-24 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted">{blurb}</p>
        <p className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm text-muted">This page is coming soon.</p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
          <ArrowLeft className="size-4" /> Back to Wera
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
