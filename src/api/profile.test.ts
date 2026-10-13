import { describe, expect, it } from 'vitest';
import { normalizeProfile } from './profile';
import type { Profile } from './types';

describe('normalizeProfile', () => {
  it('turns null preference lists into empty ones', () => {
    // What the API sent for a profile started by a resume upload.
    const raw = {
      markdown: '',
      resume_text: 'Alex',
      resume_file: null,
      preferences: { role_families: null, levels: null, max_years_required: 0, us_only: false, needs_sponsorship: false },
      answers: {},
      resume_chars: 4,
      ready: false,
      updated_at: null,
    } as unknown as Profile;
    const p = normalizeProfile(raw);
    expect(p.preferences.role_families).toEqual([]);
    expect(p.preferences.levels).toEqual([]);
    expect(p.preferences.max_years_required).toBe(0);
  });
});
