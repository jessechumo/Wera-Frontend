import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Link2, Plus, Trash2 } from 'lucide-react';
import type { Bullet, Entry, ResumeData, Section, SkillGroup } from '../api/resumes';
import { move, newBullet, newEntry, newSection, newSkillGroup, removeAt, replaceAt, SECTION_PRESETS } from './edit';

// field-sizing: content makes text boxes grow with their text (Chromium);
// elsewhere the row estimates below apply.
const INPUT =
  '[field-sizing:content] w-full rounded-md border border-transparent bg-surface-2/60 px-2 py-1 text-[13px] text-text placeholder:text-faint hover:border-border focus:border-accent/60 focus:bg-surface focus:outline-none';

function IconBtn({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className="rounded p-1 text-faint transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-30">
      {children}
    </button>
  );
}

/** Move up/down, hide/show and delete, for any row. */
function RowTools({ i, n, hidden, onMove, onHide, onDelete, what }: {
  i: number; n: number; hidden?: boolean; onMove: (to: number) => void; onHide?: () => void; onDelete: () => void; what: string;
}) {
  return (
    <div className="flex shrink-0 items-center opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <IconBtn label={`Move ${what} up`} onClick={() => onMove(i - 1)} disabled={i === 0}><ArrowUp className="size-3.5" /></IconBtn>
      <IconBtn label={`Move ${what} down`} onClick={() => onMove(i + 1)} disabled={i === n - 1}><ArrowDown className="size-3.5" /></IconBtn>
      {onHide && (
        <IconBtn label={hidden ? `Show ${what}` : `Hide ${what}`} onClick={onHide}>
          {hidden ? <EyeOff className="size-3.5 text-warn" /> : <Eye className="size-3.5" />}
        </IconBtn>
      )}
      <IconBtn label={`Delete ${what}`} onClick={onDelete}><Trash2 className="size-3.5" /></IconBtn>
    </div>
  );
}

function Bullets({ bullets, onChange }: { bullets: Bullet[]; onChange: (b: Bullet[]) => void }) {
  return (
    <div className="mt-1.5 space-y-1">
      {bullets.map((b, i) => (
        <div key={b.id} className={clsx('group flex items-start gap-1', b.hidden && 'opacity-45')}>
          <span className="mt-1.5 text-faint">•</span>
          <textarea
            rows={Math.max(1, Math.ceil(b.text.length / 55))}
            value={b.text}
            onChange={(e) => onChange(replaceAt(bullets, i, { ...b, text: e.target.value }))}
            placeholder="What you did, how, and the result"
            aria-label={`Bullet ${i + 1}`}
            className={clsx(INPUT, 'resize-none leading-snug', b.hidden && 'line-through')}
          />
          <RowTools what="bullet" i={i} n={bullets.length} hidden={b.hidden}
            onMove={(to) => onChange(move(bullets, i, to))}
            onHide={() => onChange(replaceAt(bullets, i, { ...b, hidden: !b.hidden }))}
            onDelete={() => onChange(removeAt(bullets, i))} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...bullets, newBullet()])} className="ml-3 inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent">
        <Plus className="size-3" /> Bullet
      </button>
    </div>
  );
}

function EntryEditor({ kind, e, onChange }: { kind: Section['kind']; e: Entry; onChange: (e: Entry) => void }) {
  const set = (k: keyof Entry) => (ev: { target: { value: string } }) => onChange({ ...e, [k]: ev.target.value });
  if (kind === 'compact') {
    return (
      <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_11rem]">
        <input className={clsx(INPUT, 'font-semibold')} value={e.heading} onChange={set('heading')} placeholder="Title" aria-label="Title" />
        <input className={clsx(INPUT, 'italic')} value={e.subheading ?? ''} onChange={set('subheading')} placeholder="Organization" aria-label="Organization" />
        <input className={INPUT} value={e.dates ?? ''} onChange={set('dates')} placeholder="Dates" aria-label="Dates" />
      </div>
    );
  }
  if (kind === 'projects') {
    return (
      <div className="space-y-1">
        <div className="grid gap-1 sm:grid-cols-[1fr_1.4fr]">
          <input className={clsx(INPUT, 'font-semibold')} value={e.heading} onChange={set('heading')} placeholder="Project" aria-label="Project" />
          <input className={clsx(INPUT, 'italic')} value={e.tech ?? ''} onChange={set('tech')} placeholder="Stack" aria-label="Stack" />
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
    <div>
      <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <input className={clsx(INPUT, 'font-semibold')} value={e.heading} onChange={set('heading')} placeholder="Organization or school" aria-label="Organization" />
        <input className={clsx(INPUT, 'text-right')} value={e.dates ?? ''} onChange={set('dates')} placeholder="Dates" aria-label="Dates" />
        <input className={clsx(INPUT, 'italic')} value={e.subheading ?? ''} onChange={set('subheading')} placeholder="Title or degree" aria-label="Title" />
        <input className={clsx(INPUT, 'text-right italic')} value={e.location ?? ''} onChange={set('location')} placeholder="Location" aria-label="Location" />
      </div>
      <Bullets bullets={e.bullets ?? []} onChange={(bullets) => onChange({ ...e, bullets })} />
    </div>
  );
}

function SkillsEditor({ groups, onChange }: { groups: SkillGroup[]; onChange: (g: SkillGroup[]) => void }) {
  return (
    <div className="space-y-1">
      {groups.map((g, i) => (
        <div key={g.id} className="group grid grid-cols-[10rem_minmax(0,1fr)_auto] items-start gap-1">
          <input className={clsx(INPUT, 'font-semibold')} value={g.name} onChange={(e) => onChange(replaceAt(groups, i, { ...g, name: e.target.value }))} aria-label="Group" />
          <textarea rows={Math.max(1, Math.ceil(g.items.length / 45))} className={clsx(INPUT, 'resize-none')} value={g.items}
            onChange={(e) => onChange(replaceAt(groups, i, { ...g, items: e.target.value }))} placeholder="Comma-separated" aria-label={`${g.name} items`} />
          <RowTools what="group" i={i} n={groups.length} onMove={(to) => onChange(move(groups, i, to))} onDelete={() => onChange(removeAt(groups, i))} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...groups, newSkillGroup()])} className="inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent">
        <Plus className="size-3" /> Group
      </button>
    </div>
  );
}

function SectionEditor({ s, onChange }: { s: Section; onChange: (s: Section) => void }) {
  const entries = s.entries ?? [];
  return (
    <div className="space-y-2">
      {s.kind === 'skills' && <SkillsEditor groups={s.skills ?? []} onChange={(skills) => onChange({ ...s, skills })} />}
      {s.kind === 'summary' && (
        <textarea rows={3} className={clsx(INPUT, 'resize-y')} value={s.text ?? ''} onChange={(e) => onChange({ ...s, text: e.target.value })} aria-label="Summary" />
      )}
      {entries.map((e, i) => (
        <div key={e.id} className={clsx('group rounded-lg border border-border/70 p-2', e.hidden && 'opacity-45')}>
          <div className="flex items-start gap-1">
            <GripVertical className="mt-1.5 size-3.5 shrink-0 text-faint" aria-hidden />
            <div className="min-w-0 flex-1">
              <EntryEditor kind={s.kind} e={e} onChange={(ne) => onChange({ ...s, entries: replaceAt(entries, i, ne) })} />
            </div>
            <RowTools what="entry" i={i} n={entries.length} hidden={e.hidden}
              onMove={(to) => onChange({ ...s, entries: move(entries, i, to) })}
              onHide={() => onChange({ ...s, entries: replaceAt(entries, i, { ...e, hidden: !e.hidden }) })}
              onDelete={() => onChange({ ...s, entries: removeAt(entries, i) })} />
          </div>
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

/** The whole resume as an editable form, laid out like the document. */
export function ResumeForm({ data, onChange }: { data: ResumeData; onChange: (d: ResumeData) => void }) {
  const [adding, setAdding] = useState(false);
  const set = (k: keyof ResumeData) => (e: { target: { value: string } }) => onChange({ ...data, [k]: e.target.value });
  const links = data.links ?? [];
  return (
    <div className="space-y-4">
      <section aria-label="Header" className="space-y-1.5 rounded-card border border-border bg-surface p-3">
        <input className={clsx(INPUT, 'text-center text-lg font-semibold tracking-wide')} value={data.name} onChange={set('name')} placeholder="Your name" aria-label="Name" />
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

      {data.sections.map((s, i) => (
        <section key={s.id} aria-label={s.title} className={clsx('group/section rounded-card border border-border bg-surface p-3', s.hidden && 'opacity-50')}>
          <div className="group mb-2 flex items-center gap-1 border-b border-border pb-1.5">
            <input className={clsx(INPUT, 'font-semibold uppercase tracking-wide')} value={s.title}
              onChange={(e) => onChange({ ...data, sections: replaceAt(data.sections, i, { ...s, title: e.target.value }) })} aria-label="Section title" />
            <RowTools what="section" i={i} n={data.sections.length} hidden={s.hidden}
              onMove={(to) => onChange({ ...data, sections: move(data.sections, i, to) })}
              onHide={() => onChange({ ...data, sections: replaceAt(data.sections, i, { ...s, hidden: !s.hidden }) })}
              onDelete={() => window.confirm(`Delete the ${s.title} section?`) && onChange({ ...data, sections: removeAt(data.sections, i) })} />
          </div>
          <SectionEditor s={s} onChange={(ns) => onChange({ ...data, sections: replaceAt(data.sections, i, ns) })} />
        </section>
      ))}

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
    </div>
  );
}
