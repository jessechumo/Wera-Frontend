import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { MapPin, Plus, X } from 'lucide-react';
import { searchPlaces } from './places';

/**
 * Multi-select location input: type to search major metros and cities,
 * pick with the mouse or arrow keys + Enter, or press Enter on any text to
 * add it as typed. Backspace in the empty input removes the last chip.
 */
export function LocationPicker({
  value,
  onChange,
  placeholder = 'Type a city or metro…',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = searchPlaces(query, value);
  const typed = query.trim();
  const custom = typed !== '' && !results.some((r) => r.name.toLowerCase() === typed.toLowerCase());
  const options = [...results.map((r) => r.name), ...(custom ? [typed] : [])];

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const add = (name: string) => {
    const n = name.trim();
    if (n && !value.some((v) => v.toLowerCase() === n.toLowerCase())) onChange([...value, n]);
    setQuery('');
    input.current?.focus();
  };
  const remove = (name: string) => onChange(value.filter((v) => v !== name));

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && options[active]) {
        e.preventDefault();
        add(options[active]!);
      } else if (typed) {
        e.preventDefault();
        add(typed);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
      remove(value[value.length - 1]!);
    }
  };

  return (
    <div ref={box} className="relative">
      <div
        onClick={() => input.current?.focus()}
        className="flex min-h-[38px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-1.5 transition-colors duration-150 hover:border-accent/40 focus-within:border-accent/60"
      >
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-accent/15 py-0.5 pr-1 pl-2 text-xs font-medium text-accent"
          >
            {v}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(v);
              }}
              aria-label={`Remove ${v}`}
              className="rounded-full p-0.5 hover:bg-accent/20"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={value.length === 0 ? placeholder : 'Add another…'}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Locations"
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm text-text outline-none placeholder:text-faint"
        />
      </div>
      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="fade-enter absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-xl shadow-black/20"
        >
          {options.map((name, i) => {
            const isCustom = custom && i === options.length - 1;
            return (
              <li
                key={name + i}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus in the input
                  add(name);
                }}
                className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm',
                  i === active ? 'bg-accent/10 text-text' : 'text-muted',
                )}
              >
                {isCustom ? (
                  <Plus className="size-3.5 shrink-0 text-faint" />
                ) : (
                  <MapPin className="size-3.5 shrink-0 text-faint" />
                )}
                {isCustom ? (
                  <span>
                    Add <span className="font-medium text-text">“{name}”</span>
                  </span>
                ) : (
                  name
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
