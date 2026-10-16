// Illustrations for the landing page: inline SVG and HTML drawn with the
// theme's colors, so they suit light and dark mode and stay crisp.
import clsx from 'clsx';
import { Check, Landmark, MapPin, Sparkles } from 'lucide-react';
import { ScoreRing } from '../components/ScoreRing';
import { IndustryIcon } from '../components/IndustryIcon';

const v = (name: string) => `var(--color-${name})`;

const JOBS = [
  { title: 'Machine Learning Engineer, New Grad', company: 'Frontier AI lab', place: 'San Francisco · Hybrid', score: 94, sponsor: true, ind: 'ai_ml' },
  { title: 'Software Engineer, Flight Software', company: 'Launch startup', place: 'Hawthorne, CA · Onsite', score: 88, sponsor: true, ind: 'aerospace' },
  { title: 'Platform Engineer I', company: 'Payments company', place: 'Remote, US', score: 81, sponsor: false, ind: 'fintech' },
];

/** A stack of matched jobs, like Today. */
export function ProductMock({ className }: { className?: string }) {
  return (
    <div className={clsx('relative', className)} aria-hidden>
      <div className="absolute -inset-3 -z-10 rounded-[2rem] sm:-inset-6 bg-[radial-gradient(closest-side,var(--color-glow),transparent)] blur-2xl" />
      <div className="rounded-2xl border border-border bg-surface/90 p-3 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.35)] backdrop-blur">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-text">Today</span>
          <span className="rounded-full bg-good/10 px-2 py-0.5 text-[10px] font-medium text-good">34 new matches</span>
        </div>
        <div className="space-y-2">
          {JOBS.map((j, i) => (
            <div key={i} className={clsx('flex items-center gap-3 rounded-xl border border-border bg-surface p-3', i === 0 && 'ring-1 ring-accent/30')}>
              <ScoreRing score={j.score} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-text">{j.title}</div>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] whitespace-nowrap text-muted">
                  <IndustryIcon id={j.ind} size="xs" bare /> <span className="truncate">{j.company}</span>
                  <span className="text-faint">·</span>
                  <MapPin className="size-3 shrink-0 text-faint" /> <span className="truncate">{j.place}</span>
                </div>
              </div>
              {j.sponsor && <span className="hidden shrink-0 rounded-full bg-good/10 px-2 py-0.5 text-[10px] font-medium text-good sm:inline">Sponsors visas</span>}
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-xl bg-surface-2/70 px-3 py-2 text-[11px] leading-relaxed text-muted">
          <Sparkles className="mr-1 inline size-3 text-accent" />
          Your PyTorch and ranking work lines up with the team's needs; entry level, 0+ years, H-1B filed 1,202 times last year.
        </div>
      </div>
    </div>
  );
}

/** A one-page resume with highlighted keywords. */
export function ResumeMock({ className }: { className?: string }) {
  const line = (y: number, w: number, x = 22, o = 0.22) => <rect x={x} y={y} width={w} height="4" rx="2" fill={v('text')} opacity={o} />;
  return (
    <svg viewBox="0 0 200 250" className={className} aria-hidden>
      <rect x="6" y="6" width="188" height="238" rx="10" fill={v('surface')} stroke={v('border')} />
      <rect x="62" y="20" width="76" height="8" rx="4" fill={v('text')} opacity="0.75" />
      {line(34, 110, 45, 0.18)}
      {[52, 108, 164].map((y, s) => (
        <g key={y}>
          <rect x="22" y={y} width={[44, 54, 38][s]} height="5" rx="2" fill={v('accent')} opacity="0.85" />
          <rect x="22" y={y + 9} width="156" height="1" fill={v('border')} />
          {line(y + 16, 120)}{line(y + 24, 140)}
          {line(y + 32, 96)}{line(y + 40, 128)}
        </g>
      ))}
      <rect x="70" y="122" width="34" height="6" rx="3" fill={v('good')} opacity="0.35" />
      <rect x="110" y="178" width="28" height="6" rx="3" fill={v('good')} opacity="0.35" />
      <g transform="translate(150 206)">
        <circle r="18" fill={v('good')} opacity="0.12" />
        <path d="M-7 0 l5 5 l10 -11" stroke={v('good')} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A small H-1B card: filings and pay by level. */
export function H1BMock({ className }: { className?: string }) {
  const bars = [{ l: 'I', w: 58, p: '$129k' }, { l: 'II', w: 70, p: '$157k' }, { l: 'III', w: 84, p: '$172k' }, { l: 'IV', w: 100, p: '$194k' }];
  return (
    <div className={clsx('rounded-2xl border border-border bg-surface p-4 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.35)]', className)} aria-hidden>
      <div className="flex items-center gap-2 text-xs font-semibold text-text"><Landmark className="size-4 text-accent" /> H-1B filings · payments company</div>
      <div className="mt-3 flex items-baseline gap-4">
        <div><div className="font-mono text-2xl text-text">294</div><div className="text-[10px] text-faint">certified, last 12 months</div></div>
        <div><div className="font-mono text-2xl text-text">$163k</div><div className="text-[10px] text-faint">median offered</div></div>
      </div>
      <div className="mt-3 space-y-1.5">
        {bars.map((b) => (
          <div key={b.l} className="flex items-center gap-2 text-[10px]">
            <span className="w-6 font-mono text-faint">{b.l}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full bg-accent/70" style={{ width: `${b.w}%` }} />
            </span>
            <span className="w-10 text-right font-mono text-muted">{b.p}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-good/10 px-2 py-1.5 text-[11px] text-good">For titles like yours at entry level: $129k – $157k</div>
    </div>
  );
}

/** Step 1: a resume going in. */
export function StepUpload() {
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-auto" aria-hidden>
      <rect x="34" y="10" width="44" height="58" rx="6" fill={v('surface')} stroke={v('border')} />
      {[22, 30, 38, 46].map((y, i) => <rect key={y} x="42" y={y} width={[28, 22, 26, 18][i]} height="3" rx="1.5" fill={v('text')} opacity="0.25" />)}
      <circle cx="80" cy="64" r="15" fill={v('accent')} />
      <path d="M80 71 v-13 m-6 6 l6 -6 l6 6" stroke={v('bg')} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Step 2: the radar sweeping companies. */
export function StepRadar() {
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-auto" aria-hidden>
      {[34, 24, 14].map((r) => <circle key={r} cx="60" cy="45" r={r} fill="none" stroke={v('border')} />)}
      <path d="M60 45 L60 11 A34 34 0 0 1 89 28 Z" fill={v('accent')} opacity="0.18" />
      <line x1="60" y1="45" x2="89" y2="28" stroke={v('accent')} strokeWidth="2" strokeLinecap="round" />
      {[[78, 30, 'good'], [40, 58, 'accent-2'], [70, 66, 'faint'], [46, 30, 'good']].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r="3.5" fill={v(c as string)} />
      ))}
      <circle cx="60" cy="45" r="3" fill={v('text')} />
    </svg>
  );
}

/** Step 3: applying with confidence. */
export function StepApply() {
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-auto" aria-hidden>
      <rect x="22" y="16" width="62" height="58" rx="8" fill={v('surface')} stroke={v('border')} />
      {[28, 40, 52].map((y) => (
        <g key={y}>
          <rect x="30" y={y} width="8" height="8" rx="2" fill={v('good')} opacity="0.25" />
          <path d={`M31.5 ${y + 4} l2 2 l3.5 -4`} stroke={v('good')} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <rect x="43" y={y + 2.5} width="32" height="3" rx="1.5" fill={v('text')} opacity="0.25" />
        </g>
      ))}
      <g transform="translate(88 58) rotate(-18)">
        <path d="M-14 0 L14 -9 L6 10 L1 3 Z" fill={v('accent')} />
      </g>
    </svg>
  );
}

/** A browser window with the Wera side panel filling a form. */
export function ExtensionMock({ className }: { className?: string }) {
  return (
    <div className={clsx('overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_30px_80px_-30px_rgb(0_0_0/0.4)]', className)} aria-hidden>
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-2/60 px-3 py-2">
        {['bad', 'warn', 'good'].map((c) => <span key={c} className="size-2.5 rounded-full" style={{ background: v(c), opacity: 0.7 }} />)}
        <span className="ml-3 h-4 flex-1 rounded-md bg-surface" />
      </div>
      <div className="grid grid-cols-[1fr_44%]">
        <div className="space-y-3 p-4">
          <div className="h-3 w-32 rounded bg-text/70" />
          {['First name', 'Email', 'Sponsorship?', 'Why us?'].map((l, i) => (
            <div key={l}>
              <div className="mb-1 text-[9px] text-faint">{l}</div>
              <div className={clsx('h-6 rounded-md border px-2 text-[10px] leading-6', i < 3 ? 'border-good/50 bg-good/5 text-text' : 'border-accent/50 bg-accent/5 text-muted')}>
                {['Ada', 'ada@example.com', 'Yes, H-1B later', 'Drafted for you…'][i]}
              </div>
            </div>
          ))}
        </div>
        <div className="border-l border-border bg-bg/60 p-3">
          <div className="mb-2 text-[10px] font-semibold text-text">wera</div>
          <div className="rounded-lg bg-good/10 p-2 text-[10px] text-good"><Check className="mr-1 inline size-3" />Filled 11 fields</div>
          <div className="mt-2 space-y-1.5">
            {[90, 70, 80].map((w) => <div key={w} className="h-2 rounded bg-text/15" style={{ width: `${w}%` }} />)}
          </div>
          <div className="mt-3 rounded-lg bg-accent px-2 py-1.5 text-center text-[10px] font-semibold text-bg">Fill this step</div>
          <div className="mt-2 text-center text-[9px] text-faint">You always submit</div>
        </div>
      </div>
    </div>
  );
}
