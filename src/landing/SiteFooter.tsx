import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Logo } from '../components/Logo';

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Product',
    links: [['How it works', '/#how'], ['Features', '/#features'], ['International students', '/#international'], ['Chrome extension', '/#extension'], ['Get started', '/signup']],
  },
  { title: 'Company', links: [['About', '/about'], ['Careers', '/careers'], ['Blog', '/blog'], ['Press', '/press'], ['Contact', '/contact']] },
  { title: 'Support', links: [['Help center', '/help'], ['Log in', '/login'], ['Reset password', '/forgot-password'], ['Accessibility', '/accessibility']] },
  { title: 'Legal', links: [['Privacy policy', '/privacy'], ['Terms of service', '/terms'], ['Cookie policy', '/cookies'], ['Security', '/security']] },
];

/** The public site footer, shared by the landing page and the company pages. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Link to="/" aria-label="Wera home"><Logo /></Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Jobs that fit you, scored against your resume, with the sponsorship history behind every employer.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted"><MapPin className="size-4 text-faint" /> Texas, United States</p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="text-xs font-semibold tracking-[0.15em] text-text uppercase">{c.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map(([label, to]) => (
                  <li key={to}>
                    {/* Section anchors are plain links so the browser scrolls to them. */}
                    {to.includes('#')
                      ? <a href={to} className="text-muted transition-colors hover:text-text">{label}</a>
                      : <Link to={to} className="text-muted transition-colors hover:text-text">{label}</Link>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Wera. All rights reserved.</span>
          <span>H-1B data: US Department of Labor, public LCA disclosures.</span>
        </div>
      </div>
    </footer>
  );
}
