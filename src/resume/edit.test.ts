import { describe, expect, it } from 'vitest';
import type { ResumeData } from '../api/resumes';
import { hiddenCount, move, newSection, removeAt, replaceAt, showAll } from './edit';

describe('resume edits', () => {
  it('moves, replaces and removes without mutating', () => {
    const list = ['a', 'b', 'c'];
    expect(move(list, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(move(list, 0, -1)).toBe(list);
    expect(replaceAt(list, 1, 'B')).toEqual(['a', 'B', 'c']);
    expect(removeAt(list, 0)).toEqual(['b', 'c']);
    expect(list).toEqual(['a', 'b', 'c']);
  });

  it('builds new sections of each kind', () => {
    expect(newSection('skills', 'Skills').skills).toHaveLength(1);
    expect(newSection('summary', 'Summary').text).toBe('');
    expect(newSection('entries', 'Experience').entries![0]!.bullets).toHaveLength(1);
    expect(newSection('compact', 'More').entries![0]!.bullets).toBeUndefined();
  });

  it('counts hidden items and shows them all again', () => {
    const r: ResumeData = {
      name: 'Ada',
      sections: [{ id: 's', kind: 'entries', title: 'Exp', hidden: true, entries: [{ id: 'e', heading: 'X', hidden: true, bullets: [{ id: 'b', text: 't', hidden: true }] }] }],
    };
    expect(hiddenCount(r)).toBe(3);
    expect(hiddenCount(showAll(r))).toBe(0);
  });
});
