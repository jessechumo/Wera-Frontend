import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, prefsProblem } from './PreferencesFields';

describe('prefsProblem', () => {
  it('requires a role family and a level', () => {
    expect(prefsProblem(DEFAULT_PREFS)).toMatch(/kind of role/);
    expect(prefsProblem({ ...DEFAULT_PREFS, role_families: ['sre'], levels: [] })).toMatch(/seniority/);
    expect(prefsProblem({ ...DEFAULT_PREFS, role_families: ['sre'] })).toBeNull();
  });
});
