import { useState } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, pointerWithin, rectIntersection, useDraggable,
  useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useJobs, useUpdateApplication } from '../api/hooks';
import type { AppStatus, Job } from '../api/types';
import { AutofilledBadge } from '../components/JobBadges';
import { JobDrawer } from '../components/JobDrawer';
import { StatusSelect } from '../components/StatusSelect';
import { Skeleton } from '../components/States';
import { relTime, verdictColor, verdictOf } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import clsx from 'clsx';
import { ExternalLink, EyeOff, KanbanSquare, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLUMNS: AppStatus[] = ['saved', 'applied', 'interviewing', 'offer', 'rejected'];

const COLUMN_LABEL: Record<AppStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  not_interested: 'Not interested',
};

function KanbanCard({
  job,
  index = 0,
  onOpen,
  onStatus,
}: {
  job: Job;
  /** Position in the column; drives the staggered entrance delay. */
  index?: number;
  onOpen: (id: number) => void;
  onStatus: (id: number, status: AppStatus) => void;
}) {
  const verdict = verdictOf(job.fit_score);
  return (
    <div
      className="group anim-rise rounded-xl border border-border bg-surface p-3 transition-colors duration-150 hover:border-accent/40"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div
        onClick={() => onOpen(job.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onOpen(job.id);
        }}
        className="cursor-pointer"
        aria-label={`${job.title} at ${job.company}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 min-w-0 text-xs font-semibold text-text">{job.title}</h4>
          <span className={clsx('font-mono text-xs font-semibold', verdictColor[verdict])}>
            {job.fit_score ?? '—'}
          </span>
        </div>
        <div className="mt-1 truncate text-[11px] text-muted">{job.company}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-faint">
          <span>
            {job.application_status === 'applied'
              ? 'first seen '
              : ''}
            {relTime(job.first_seen_at)}
          </span>
          <AutofilledBadge at={job.autofilled_at} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <StatusSelect
          value={job.application_status}
          onChange={(s) => onStatus(job.id, s)}
          className="min-w-0 flex-1"
          label={`Status for ${job.title}`}
        />
        <a
          href={job.url}
          data-wera-job={job.id}
          target="_blank"
          rel="noreferrer"
          aria-label="Open posting"
          className="shrink-0 rounded-lg border border-border bg-surface-2 p-1.5 text-muted transition-colors duration-150 hover:border-accent/40 hover:text-accent"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

/** A card you can pick up and drop on another column, like a Jira board. */
function DraggableCard(props: Parameters<typeof KanbanCard>[0]) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: props.job.id, data: { job: props.job } });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-roledescription="draggable job"
      // No text selection or callout on a long press, which would cancel a touch drag.
      className={clsx(
        'cursor-grab rounded-xl outline-none select-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-accent',
        isDragging && 'opacity-30',
      )}
    >
      <KanbanCard {...props} />
    </div>
  );
}

/** One status in the drop bar. */
function DropTarget({ status, current }: { status: AppStatus; current: AppStatus | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: `bar:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex min-w-0 flex-1 items-center justify-center rounded-lg border px-1 py-3 text-center text-[11px] leading-tight font-medium transition-colors',
        isOver ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface text-muted',
        status === current && 'opacity-40',
      )}
    >
      {COLUMN_LABEL[status]}
    </div>
  );
}

/**
 * While a card is dragged on a phone or tablet, every status sits at the bottom of the
 * screen, so a column further down the page is one short move away.
 */
function DropBar({ columns, current }: { columns: AppStatus[]; current: AppStatus | null }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur xl:hidden">
      <p className="mb-1.5 text-center text-[11px] text-faint">Drop on a status</p>
      <div className="flex gap-1.5">
        {columns.map((st) => <DropTarget key={st} status={st} current={current} />)}
      </div>
    </div>
  );
}

// The pointer's column when there is one; keyboard drags fall back to overlap.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

/** True once every column has loaded and none holds a job. */
function useNothingTracked() {
  // The same queries the columns make: shared from the cache, no extra requests.
  const results = COLUMNS.map((status) => useJobs({ status, limit: 100, sort: 'newest' })); // eslint-disable-line react-hooks/rules-of-hooks -- fixed list
  return results.every((r) => r.data && r.data.jobs.length === 0);
}

const COLUMN_HINT: Record<string, string> = {
  saved: 'Jobs you bookmark',
  applied: 'Moves here when you submit',
  interviewing: 'Recruiter calls, loops and onsites',
  offer: 'The good news',
  rejected: 'It happens; it keeps the record',
};

/** A small drawn board: a job card slides from Saved toward Applied. */
function BoardArt() {
  const v = (n: string) => `var(--color-${n})`;
  const cols = [
    { x: 8, label: 'Saved', cards: 2 },
    { x: 88, label: 'Applied', cards: 1 },
    { x: 168, label: 'Interview', cards: 1 },
    { x: 248, label: 'Offer', cards: 0 },
  ];
  return (
    <svg viewBox="0 0 328 168" className="h-auto w-[400px] max-w-full" aria-hidden>
      {cols.map((c) => (
        <g key={c.label}>
          <rect x={c.x} y="8" width="72" height="152" rx="10" fill={v('surface-2')} opacity="0.7" />
          <text x={c.x + 10} y="26" fontSize="9" fontWeight="600" fill={v('muted')} fontFamily="var(--font-sans)">{c.label}</text>
          {Array.from({ length: c.cards }, (_, i) => (
            <g key={i} transform={`translate(${c.x + 6} ${36 + i * 40})`}>
              <rect width="60" height="32" rx="6" fill={v('surface')} stroke={v('border')} />
              <rect x="7" y="8" width="34" height="4" rx="2" fill={v('text')} opacity="0.55" />
              <rect x="7" y="17" width="24" height="3" rx="1.5" fill={v('text')} opacity="0.2" />
              <circle cx="50" cy="16" r="5" fill="none" stroke={c.label === 'Offer' ? v('good') : v('accent')} strokeWidth="2" opacity="0.8" />
            </g>
          ))}
        </g>
      ))}
      {/* The card on its way to Applied */}
      <g className="tracker-slide">
        <rect x="56" y="104" width="60" height="32" rx="6" fill={v('surface')} stroke={v('accent')} strokeWidth="1.5" />
        <rect x="63" y="112" width="34" height="4" rx="2" fill={v('text')} opacity="0.6" />
        <rect x="63" y="121" width="24" height="3" rx="1.5" fill={v('text')} opacity="0.25" />
        <circle cx="106" cy="120" r="5" fill="none" stroke={v('good')} strokeWidth="2" />
      </g>
      <path d="M124 120 h18 m-5 -4 l5 4 l-5 4" stroke={v('accent')} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <g transform="translate(262 52)">
        <circle r="13" fill={v('good')} opacity="0.12" />
        <path d="M-5 0 l3.5 3.5 l7 -8" stroke={v('good')} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** The tracker before anything is tracked: what it is for, and the board to come. */
function TrackerEmpty() {
  return (
    <div className="space-y-4">
      <section className="anim-rise grid items-center gap-8 overflow-hidden rounded-card border border-border bg-surface p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div className="max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
            <KanbanSquare className="size-3.5" /> Your pipeline
          </span>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">Nothing tracked yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Save a job you like, or mark one as applied, and it lands here. Move it along from saved to applied,
            interviewing and offer as things progress, so you always know what to follow up on.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent/85">
              <Search className="size-4" /> Find jobs to track
            </Link>
            <Link to="/jobs" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-text hover:border-accent/40">
              Browse all jobs
            </Link>
          </div>
          <p className="mt-4 text-xs text-faint">Tip: the Chrome extension moves a job to Applied when you submit its application.</p>
        </div>
        <div className="hidden justify-self-center md:block"><BoardArt /></div>
      </section>

      {/* The board to come, faded, with what each column holds. */}
      <div aria-hidden className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((status) => (
          <div key={status} className="rounded-card border border-border bg-surface/40 p-2.5">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted">{COLUMN_LABEL[status]}</span>
              <span className="font-mono text-xs text-faint">0</span>
            </div>
            <div className="rounded-lg border border-dashed border-border px-3 py-7 text-center text-xs leading-snug text-muted">
              {COLUMN_HINT[status]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Column({
  status,
  onOpen,
  onStatus,
}: {
  status: AppStatus;
  onOpen: (id: number) => void;
  onStatus: (id: number, status: AppStatus) => void;
}) {
  const { data, isLoading } = useJobs({ status, limit: 100, sort: 'newest' });
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const jobs = data?.jobs ?? [];
  return (
    <section
      ref={setNodeRef}
      aria-label={COLUMN_LABEL[status]}
      className={clsx(
        'flex min-w-0 flex-col rounded-card border p-2.5 transition-colors duration-150',
        isOver ? 'border-accent/60 bg-accent/5' : 'border-border bg-surface/60',
      )}
    >
      <header className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-text">{COLUMN_LABEL[status]}</h3>
        <span className="font-mono text-xs text-faint">{jobs.length}</span>
      </header>
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : jobs.length === 0 ? (
          <p className="px-1 py-4 text-center text-[11px] text-faint">Nothing here yet</p>
        ) : (
          jobs.map((job, i) => (
            <DraggableCard key={job.id} job={job} index={i} onOpen={onOpen} onStatus={onStatus} />
          ))
        )}
      </div>
    </section>
  );
}

export default function TrackerPage() {
  useDocumentTitle('Tracker');
  const update = useUpdateApplication();
  const [showNI, setShowNI] = useState(false);
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [dragging, setDragging] = useState<Job | null>(null);
  // A small move or a short press before a drag, so clicks, the status menu and scrolling keep working.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onStatus = (id: number, status: AppStatus) =>
    update.mutate({ id, status, notes: '' });

  const columns = showNI ? [...COLUMNS, 'not_interested' as AppStatus] : COLUMNS;
  const empty = useNothingTracked();

  const onDragStart = (e: DragStartEvent) => setDragging((e.active.data.current?.job as Job | undefined) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const job = e.active.data.current?.job as Job | undefined;
    const over = e.over ? String(e.over.id) : '';
    const to = (over.startsWith('bar:') ? over.slice(4) : over) as AppStatus | '';
    if (job && to && to !== job.application_status) onStatus(job.id, to);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-tight font-semibold">Tracker</h1>
          <p className="mt-1 text-xs text-muted">
            Drag a card to another column to move it along, or use the status menu on the card.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted select-none">
          <input
            type="checkbox"
            checked={showNI}
            onChange={(e) => setShowNI(e.target.checked)}
            className="size-3.5 accent-accent"
          />
          <EyeOff className="size-3.5" />
          Show not interested
        </label>
      </header>

      {empty && <TrackerEmpty />}
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div
          className={clsx(
            empty && 'hidden',
            'grid gap-3 sm:grid-cols-2 xl:grid-cols-5',
            showNI && 'xl:grid-cols-6',
          )}
        >
          {columns.map((status) => (
            <Column key={status} status={status} onOpen={(id) => setDrawerId(id)} onStatus={onStatus} />
          ))}
        </div>
        {dragging && <DropBar columns={columns} current={dragging.application_status} />}
        <DragOverlay dropAnimation={null}>
          {dragging && (
            <div className="rotate-2 cursor-grabbing rounded-xl shadow-2xl">
              <KanbanCard job={dragging} onOpen={() => {}} onStatus={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {drawerId != null && <JobDrawer jobId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  );
}
