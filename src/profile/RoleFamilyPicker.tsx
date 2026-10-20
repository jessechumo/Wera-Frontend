import { useState } from 'react';
import clsx from 'clsx';
import type { Choice, RoleFamilyChoice } from '../api/types';
import { ChipSelect } from './ChipSelect';

const byLabel = (a: Choice, b: Choice) => a.label.localeCompare(b.label);

/**
 * Role families grouped by career field: one tab per field (with how many
 * of its roles are picked) and that field's roles as chips. Opens on the
 * field of the first picked role, so a nurse lands on Healthcare.
 */
export function RoleFamilyPicker({
  fields,
  families,
  value,
  onChange,
}: {
  fields?: Choice[];
  families: RoleFamilyChoice[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const grouped = (fields ?? []).filter((f) => families.some((r) => r.field === f.id));
  const fieldOf = (id: string) => families.find((r) => r.id === id)?.field;
  const [open, setOpen] = useState(() => fieldOf(value[0] ?? '') ?? grouped[0]?.id);
  if (grouped.length < 2) {
    return <ChipSelect label="Role families" options={[...families].sort(byLabel)} value={value} onChange={onChange} />;
  }
  const active = grouped.some((f) => f.id === open) ? open : grouped[0].id;
  const shown = families.filter((r) => r.field === active).sort(byLabel);
  return (
    <div className="space-y-2.5">
      <div role="tablist" aria-label="Career fields" className="flex flex-wrap gap-1.5">
        {grouped.map((f) => {
          const picked = value.filter((id) => fieldOf(id) === f.id).length;
          const on = f.id === active;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setOpen(f.id)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                on ? 'border-accent/60 bg-accent/10 text-text' : 'border-border bg-surface-2 text-muted hover:text-text',
              )}
            >
              {f.label}
              {picked > 0 && (
                <span className="rounded-full bg-accent/20 px-1.5 text-[10px] text-accent" aria-label={`${picked} picked`}>
                  {picked}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" aria-label={grouped.find((f) => f.id === active)?.label}>
        <ChipSelect
          label="Role families"
          options={shown}
          value={value}
          // Picks in other fields stay picked while this one changes.
          onChange={(v) => onChange([...value.filter((id) => fieldOf(id) !== active), ...v.filter((id) => fieldOf(id) === active)])}
        />
      </div>
    </div>
  );
}
