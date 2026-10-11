// Pure, immutable edits on a resume document (easy to test and to undo).
import type { Bullet, Entry, ResumeData, Section, SectionKind, SkillGroup } from '../api/resumes';

/** A short random id, like the server's. */
export const newId = () => Math.random().toString(16).slice(2, 12).padEnd(10, '0');

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it!);
  return next;
}

export function replaceAt<T>(list: T[], i: number, value: T): T[] {
  return list.map((x, j) => (j === i ? value : x));
}

export function removeAt<T>(list: T[], i: number): T[] {
  return list.filter((_, j) => j !== i);
}

export const SECTION_PRESETS: { kind: SectionKind; title: string; label: string }[] = [
  { kind: 'entries', title: 'Experience', label: 'Experience' },
  { kind: 'entries', title: 'Education', label: 'Education' },
  { kind: 'projects', title: 'Projects', label: 'Projects' },
  { kind: 'skills', title: 'Technical Skills', label: 'Skills' },
  { kind: 'compact', title: 'Additional Experience', label: 'One-line roles' },
  { kind: 'summary', title: 'Summary', label: 'Summary' },
];

export function newEntry(kind: SectionKind): Entry {
  if (kind === 'projects') return { id: newId(), heading: 'Project', tech: '', text: '' };
  if (kind === 'compact') return { id: newId(), heading: 'Role', subheading: 'Organization', dates: '' };
  return { id: newId(), heading: 'Organization', subheading: 'Title', dates: '', location: '', bullets: [newBullet()] };
}

export const newBullet = (): Bullet => ({ id: newId(), text: '' });
export const newSkillGroup = (): SkillGroup => ({ id: newId(), name: 'Group', items: '' });

export function newSection(kind: SectionKind, title: string): Section {
  if (kind === 'skills') return { id: newId(), kind, title, skills: [newSkillGroup()] };
  if (kind === 'summary') return { id: newId(), kind, title, text: '' };
  return { id: newId(), kind, title, entries: [newEntry(kind)] };
}

/** Counts of what is hidden, for a quick summary. */
export function hiddenCount(r: ResumeData): number {
  let n = 0;
  for (const s of r.sections) {
    if (s.hidden) n++;
    for (const e of s.entries ?? []) {
      if (e.hidden) n++;
      for (const b of e.bullets ?? []) if (b.hidden) n++;
    }
  }
  return n;
}

/** Shows everything again (undoes fitting). */
export function showAll(r: ResumeData): ResumeData {
  return {
    ...r,
    sections: r.sections.map((s) => ({
      ...s,
      hidden: false,
      entries: s.entries?.map((e) => ({ ...e, hidden: false, bullets: e.bullets?.map((b) => ({ ...b, hidden: false })) })),
    })),
  };
}
