import clsx from 'clsx';
import { Check } from 'lucide-react';
import type { Choice } from '../api/types';

/** Multi-select as toggle chips. */
export function ChipSelect({
  options,
  value,
  onChange,
  label,
}: {
  options: Choice[];
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            title={o.description}
            onClick={() => toggle(o.id)}
            className={clsx(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150',
              on
                ? 'border-accent/60 bg-accent/15 text-accent'
                : 'border-border bg-surface-2 text-muted hover:border-accent/40 hover:text-text',
            )}
          >
            {on && <Check className="size-3" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
