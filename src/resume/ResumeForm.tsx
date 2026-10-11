import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, ChevronDown, CircleAlert, Eye, EyeOff, GripVertical, Link2, MoreHorizontal, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Bullet, Entry, ResumeData, ReviewCheck, Section, SkillGroup } from '../api/resumes';
import { BulletSuggest } from './BulletSuggest';
import { move, newBullet, newEntry, newSection, newSkillGroup, removeAt, replaceAt, SECTION_PRESETS, targetId, type Issues } from './edit';
import { useReorder } from './useReorder';

// field-sizing: content makes text boxes grow with their text (Chromium);
// elsewhere the row estimates below apply.
const INPUT =
  '[field-sizing:content] w-full rounded-md border border-transparent bg-surface-2/60 px-2 py-1 text-[13px] text-text placeholder:text-faint hover:border-border focus:border-accent/60 focus:bg-surface focus:outline-none';

const KIND_LABEL: Record<Section['kind'], string> = {
  entries: 'Roles or schools', projects: 'Projects', compact: 'One-line items', skills: 'Skill groups', summary: 'Paragraph',
};


function IconBtn({ label, onClick, children, disabled, active }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean; active?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={clsx('rounded p-1 transition-colors hover:bg-surface-2 disabled:opacity-30', active ? 'text-accent' : 'text-faint hover:text-text')}>
      {children}
    </button>
  );
}

function RowTools({ i, n, hidden, onMove, onHide, onDelete, what, extra }: {
  i: number; n: number; hidden?: boolean; onMove: (to: number) => void; onHide?: () => void; onDelete: () => void; what: string; extra?: ReactNode;
}) {
  // Phones: the tools fold behind one button so the text keeps its width.
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex shrink-0 items-center">
      <span className="sm:hidden">
        <IconBtn label={`${what} actions`} active={open} onClick={() => setOpen((v) => !v)}><MoreHorizontal className="size-4" /></IconBtn>
      </span>
      <div className={clsx('items-center opacity-50 transition-opacity group-hover:opacity-100 focus-within:opacity-100 sm:flex',
        open ? 'absolute top-full right-0 z-10 flex rounded-lg border border-border bg-bg opacity-100 shadow-lg' : 'hidden')}>
      {extra}
      <IconBtn label={`Move ${what} up`} onClick={() => onMove(i - 1)} disabled={i === 0}><ArrowUp className="size-3.5" /></IconBtn>
      <IconBtn label={`Move ${what} down`} onClick={() => onMove(i + 1)} disabled={i === n - 1}><ArrowDown className="size-3.5" /></IconBtn>
      {onHide && (
        <IconBtn label={hidden ? `Show ${what}` : `Hide ${what}`} onClick={onHide}>
          {hidden ? <EyeOff className="size-3.5 text-warn" /> : <Eye className="size-3.5" />}
        </IconBtn>
      )}
      <IconBtn label={`Delete ${what}`} onClick={onDelete}><Trash2 className="size-3.5" /></IconBtn>
      </div>
    </div>
  );
}

function Handle(props: object) {
  return (
    <span {...props} title="Drag to reorder" className="mt-1 hidden shrink-0 cursor-grab touch-none text-faint hover:text-text active:cursor-grabbing sm:inline">
      <GripVertical className="size-3.5" aria-hidden />
    </span>
  );
}

/** Review findings for one target, shown as a small marker and message. */
// Tips stay in the Review tab; fixes and improvements show in place.
const important = (checks?: ReviewCheck[]) => (checks ?? []).filter((c) => c.severity !== 'tip');

function IssueNote({ checks }: { checks?: ReviewCheck[] }) {
  const shown = important(checks);
  if (!shown.length) return null;
  return (
    <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-warn">
      <CircleAlert className="mt-px size-3 shrink-0" /> {shown.map((c) => c.message).join(' ')}
    </p>
  );
}

function Bullets({ bullets, onChange, issues, role, jobId }: { bullets: Bullet[]; onChange: (b: Bullet[]) => void; issues: Issues; role: string; jobId?: number | null }) {
  const dnd = useReorder('bullet', (from, to) => onChange(move(bullets, from, to)));
  const [suggesting, setSuggesting] = useState<string | null>(null);
  return (
    <div className="mt-1.5 space-y-1">
      {bullets.map((b, i) => (
        <div key={b.id} id={targetId(b.id)} {...dnd.target(i)}
          className={clsx('rounded-md transition-colors', dnd.over === i && dnd.dragging !== i && 'bg-accent/10', dnd.dragging === i && 'opacity-40')}>
          <div className={clsx('group flex items-start gap-1', b.hidden && 'opacity-45')}>
            <Handle {...dnd.handle(i)} />
            <textarea
              rows={Math.max(1, Math.ceil(b.text.length / 55))}
              value={b.text}
              onChange={(e) => onChange(replaceAt(bullets, i, { ...b, text: e.target.value }))}
              placeholder="Built / Cut / Led … what you did, how, and the result"
              aria-label={`Bullet ${i + 1}`}
              className={clsx(INPUT, 'resize-none leading-snug', b.hidden && 'line-through', important(issues.get(b.id)).length > 0 && 'ring-1 ring-warn/40')}
            />
            <RowTools what="bullet" i={i} n={bullets.length} hidden={b.hidden}
              extra={b.text.trim().length > 10 && (
                <IconBtn label="Suggest stronger versions" active={suggesting === b.id} onClick={() => setSuggesting(suggesting === b.id ? null : b.id)}>
                  <Sparkles className="size-3.5" />
                </IconBtn>
              )}
              onMove={(to) => onChange(move(bullets, i, to))}
              onHide={() => onChange(replaceAt(bullets, i, { ...b, hidden: !b.hidden }))}
              onDelete={() => onChange(removeAt(bullets, i))} />
          </div>
          <div className="pl-5"><IssueNote checks={issues.get(b.id)} /></div>
          {suggesting === b.id && (
            <BulletSuggest text={b.text} role={role} jobId={jobId} onClose={() => setSuggesting(null)}
              onPick={(t) => { onChange(replaceAt(bullets, i, { ...b, text: t })); setSuggesting(null); }} />
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...bullets, newBullet()])} className="ml-5 inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent">
        <Plus className="size-3" /> Bullet
      </button>
    </div>
  );
}

function EntryFields({ kind, e, onChange }: { kind: Section['kind']; e: Entry; onChange: (e: Entry) => void }) {
  const set = (k: keyof Entry) => (ev: { target: { value: string } }) => onChange({ ...e, [k]: ev.target.value });
  if (kind === 'compact') {
    return (
      <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_11rem]">
        <input className={clsx(INPUT, 'font-semibold')} value={e.heading} onChange={set('heading')} placeholder="Title, award or talk" aria-label="Title" />
        <input className={clsx(INPUT, 'italic')} value={e.subheading ?? ''} onChange={set('subheading')} placeholder="Organization (optional)" aria-label="Organization" />
        <input className={INPUT} value={e.dates ?? ''} onChange={set('dates')} placeholder="Dates" aria-label="Dates" />
      </div>
    );
  }
  if (kind === 'projects') {
    return (
      <div className="space-y-1">
        <div className="grid gap-1 sm:grid-cols-[1fr_1.4fr_9rem]">
          <input className={clsx(INPUT, 'font-semibold')} value={e.heading} onChange={set('heading')} placeholder="Project" aria-label="Project" />
          <input className={clsx(INPUT, 'italic')} value={e.tech ?? ''} onChange={set('tech')} placeholder="Stack" aria-label="Stack" />
          <input className={INPUT} value={e.dates ?? ''} onChange={set('dates')} placeholder="Dates" aria-label="Dates" />
        </div>
        <textarea rows={2} className={clsx(INPUT, 'resize-y')} value={e.text ?? ''} onChange={set('text')} placeholder="What it is and why it matters" aria-label="Description" />
        <div className="grid gap-1 sm:grid-cols-[1fr_10rem]">
          <input className={INPUT} value={e.url ?? ''} onChange={set('url')} placeholder="Link (optional)" aria-label="Link" />
          <input className={INPUT} value={e.link_label ?? ''} onChange={set('link_label')} placeholder="Link text" aria-label="Link text" />
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <input className={clsx(INPUT, 'font-semibold')} value={e.heading} onChange={set('heading')} placeholder="Organization or school" aria-label="Organization" />
      <input className={clsx(INPUT, 'text-right')} value={e.dates ?? ''} onChange={set('dates')} placeholder="Aug 2024 – Present" aria-label="Dates" />
      <input className={clsx(INPUT, 'italic')} value={e.subheading ?? ''} onChange={set('subheading')} placeholder="Title or degree" aria-label="Title" />
      <input className={clsx(INPUT, 'text-right italic')} value={e.location ?? ''} onChange={set('location')} placeholder="Location" aria-label="Location" />
    </div>
  );
}

function SkillsEditor({ groups, onChange }: { groups: SkillGroup[]; onChange: (g: SkillGroup[]) => void }) {
  const dnd = useReorder('skill', (from, to) => onChange(move(groups, from, to)));
  return (
    <div className="space-y-1">
      {groups.map((g, i) => (
        <div key={g.id} {...dnd.target(i)} className={clsx('group grid grid-cols-[auto_10rem_minmax(0,1fr)_auto] items-start gap-1 rounded-md', dnd.over === i && 'bg-accent/10')}>
          <Handle {...dnd.handle(i)} />
          <input className={clsx(INPUT, 'font-semibold')} value={g.name} onChange={(e) => onChange(replaceAt(groups, i, { ...g, name: e.target.value }))} aria-label="Group" />
          <textarea rows={Math.max(1, Math.ceil(g.items.length / 45))} className={clsx(INPUT, 'resize-none')} value={g.items}
            onChange={(e) => onChange(replaceAt(groups, i, { ...g, items: e.target.value }))} placeholder="Comma-separated" aria-label={`${g.name} items`} />
          <RowTools what="group" i={i} n={groups.length} onMove={(to) => onChange(move(groups, i, to))} onDelete={() => onChange(removeAt(groups, i))} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...groups, newSkillGroup()])} className="ml-5 inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent">
        <Plus className="size-3" /> Group
      </button>
    </div>
  );
}

function SectionBody({ s, onChange, issues, jobId }: { s: Section; onChange: (s: Section) => void; issues: Issues; jobId?: number | null }) {
  const entries = s.entries ?? [];
  const dnd = useReorder(`entry-${s.id}`, (from, to) => onChange({ ...s, entries: move(entries, from, to) }));
  return (
    <div className="space-y-2">
      {s.kind === 'skills' && <SkillsEditor groups={s.skills ?? []} onChange={(skills) => onChange({ ...s, skills })} />}
      {s.kind === 'summary' && (
        <textarea rows={3} className={clsx(INPUT, 'resize-y')} value={s.text ?? ''} onChange={(e) => onChange({ ...s, text: e.target.value })}
          placeholder="Two or three lines: who you are, what you build, what you want next" aria-label="Summary" />
      )}
      {entries.map((e, i) => (
        <div key={e.id} id={targetId(e.id)} {...dnd.target(i)}
          className={clsx('group/entry rounded-lg border border-border/70 p-2 transition-colors', e.hidden && 'opacity-45',
            dnd.over === i && dnd.dragging !== i && 'border-accent/60 bg-accent/[0.04]', dnd.dragging === i && 'opacity-40')}>
          <div className="group flex items-start gap-1">
            <Handle {...dnd.handle(i)} />
            <div className="min-w-0 flex-1"><EntryFields kind={s.kind} e={e} onChange={(ne) => onChange({ ...s, entries: replaceAt(entries, i, ne) })} /></div>
            <RowTools what="entry" i={i} n={entries.length} hidden={e.hidden}
              onMove={(to) => onChange({ ...s, entries: move(entries, i, to) })}
              onHide={() => onChange({ ...s, entries: replaceAt(entries, i, { ...e, hidden: !e.hidden }) })}
              onDelete={() => onChange({ ...s, entries: removeAt(entries, i) })} />
          </div>
          <div className="pl-5"><IssueNote checks={issues.get(e.id)} /></div>
          {(s.kind === 'entries' || s.kind === 'projects') && (
            <Bullets bullets={e.bullets ?? []} issues={issues} jobId={jobId}
              role={[e.subheading, e.heading].filter(Boolean).join(' at ')}
              onChange={(bullets) => onChange({ ...s, entries: replaceAt(entries, i, { ...e, bullets }) })} />
          )}
        </div>
      ))}
      {s.kind !== 'skills' && s.kind !== 'summary' && (
        <button type="button" onClick={() => onChange({ ...s, entries: [...entries, newEntry(s.kind)] })}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent">
          <Plus className="size-3" /> Entry
        </button>
      )}
    </div>
  );
}

/** The whole resume as an editable form, in document order. */
export function ResumeForm({ data, onChange, issues = new Map(), jobId }: { data: ResumeData; onChange: (d: ResumeData) => void; issues?: Issues; jobId?: number | null }) {
  const [adding, setAdding] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const dnd = useReorder('section', (from, to) => onChange({ ...data, sections: move(data.sections, from, to) }));
  const set = (k: keyof ResumeData) => (e: { target: { value: string } }) => onChange({ ...data, [k]: e.target.value });
  const links = data.links ?? [];
  const toggle = (id: string) => setCollapsed((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="space-y-3">
      <section aria-label="Header" className="space-y-1.5 rounded-card border border-border bg-surface p-3">
        <input className={clsx(INPUT, 'text-center text-lg font-semibold tracking-wide')} value={data.name} onChange={set('name')} placeholder="Your name" aria-label="Name" />
        <input className={clsx(INPUT, 'text-center')} value={data.headline ?? ''} onChange={set('headline')} placeholder="Headline (optional), e.g. Backend Engineer · Distributed Systems" aria-label="Headline" />
        <div className="grid gap-1 sm:grid-cols-3">
          <input className={INPUT} value={data.phone ?? ''} onChange={set('phone')} placeholder="Phone" aria-label="Phone" />
          <input className={INPUT} value={data.email ?? ''} onChange={set('email')} placeholder="Email" aria-label="Email" />
          <input className={INPUT} value={data.location ?? ''} onChange={set('location')} placeholder="City (optional)" aria-label="Location" />
        </div>
        {links.map((l, i) => (
          <div key={i} className="group flex items-center gap-1">
            <Link2 className="size-3.5 shrink-0 text-faint" />
            <input className={INPUT} value={l.label} onChange={(e) => onChange({ ...data, links: replaceAt(links, i, { ...l, label: e.target.value }) })} placeholder="Shown text" aria-label="Link text" />
            <input className={INPUT} value={l.url} onChange={(e) => onChange({ ...data, links: replaceAt(links, i, { ...l, url: e.target.value }) })} placeholder="https://" aria-label="Link address" />
            <IconBtn label="Delete link" onClick={() => onChange({ ...data, links: removeAt(links, i) })}><Trash2 className="size-3.5" /></IconBtn>
          </div>
        ))}
        {links.length < 6 && (
          <button type="button" onClick={() => onChange({ ...data, links: [...links, { label: '', url: 'https://' }] })} className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent">
            <Plus className="size-3" /> Link
          </button>
        )}
      </section>

      {data.sections.map((s, i) => {
        const open = !collapsed.has(s.id);
        return (
          <section key={s.id} id={targetId(s.id)} aria-label={s.title} {...dnd.target(i)}
            className={clsx('rounded-card border bg-surface p-3 transition-colors', s.hidden && 'opacity-50',
              dnd.over === i && dnd.dragging !== i ? 'border-accent/60' : 'border-border', dnd.dragging === i && 'opacity-40')}>
            <div className={clsx('group flex items-center gap-1', open && 'mb-2 border-b border-border pb-1.5')}>
              <Handle {...dnd.handle(i)} />
              <button type="button" onClick={() => toggle(s.id)} aria-expanded={open} aria-label={open ? `Collapse ${s.title}` : `Expand ${s.title}`}
                className="rounded p-0.5 text-faint hover:text-text">
                <ChevronDown className={clsx('size-4 transition-transform', !open && '-rotate-90')} />
              </button>
              <input className={clsx(INPUT, 'font-semibold uppercase tracking-wide')} value={s.title}
                onChange={(e) => onChange({ ...data, sections: replaceAt(data.sections, i, { ...s, title: e.target.value }) })} aria-label="Section title" />
              <span className="hidden shrink-0 text-[10px] text-faint xl:inline">{KIND_LABEL[s.kind]}</span>
              <RowTools what="section" i={i} n={data.sections.length} hidden={s.hidden}
                onMove={(to) => onChange({ ...data, sections: move(data.sections, i, to) })}
                onHide={() => onChange({ ...data, sections: replaceAt(data.sections, i, { ...s, hidden: !s.hidden }) })}
                onDelete={() => window.confirm(`Delete the ${s.title} section?`) && onChange({ ...data, sections: removeAt(data.sections, i) })} />
            </div>
            {issues.get(s.id) && <div className="mb-1 pl-6"><IssueNote checks={issues.get(s.id)} /></div>}
            {open && <SectionBody s={s} issues={issues} jobId={jobId} onChange={(ns) => onChange({ ...data, sections: replaceAt(data.sections, i, ns) })} />}
          </section>
        );
      })}

      {adding ? (
        <div className="flex flex-wrap gap-1.5 rounded-card border border-dashed border-border p-3">
          {SECTION_PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => { onChange({ ...data, sections: [...data.sections, newSection(p.kind, p.title)] }); setAdding(false); }}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted hover:border-accent/40 hover:text-accent">
              {p.label}
            </button>
          ))}
          <button type="button" onClick={() => setAdding(false)} className="px-2 text-xs text-faint hover:text-text">Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-accent">
          <Plus className="size-3.5" /> Add a section
        </button>
      )}
      <p className="text-[11px] text-faint">Tip: wrap words in **double asterisks** to make them bold.</p>
    </div>
  );
}
