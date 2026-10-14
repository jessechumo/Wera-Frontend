import { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

/**
 * A centered dialog over a dimmed page: Escape or a click outside closes
 * it. The title row has the close button; `as="form"` makes the panel the
 * form, so Enter submits.
 */
export function Modal({ title, label, hint, onClose, onSubmit, as = 'div', width = 'max-w-2xl', className, children }: {
  title: string;
  /** The dialog's accessible name, when it should say more than the title. */
  label?: string;
  hint?: ReactNode;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  as?: 'div' | 'form';
  width?: string;
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const Panel = as;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-10">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <Panel
        role="dialog"
        aria-modal="true"
        aria-label={label ?? title}
        onSubmit={onSubmit}
        className={clsx('anim-rise relative w-full rounded-card border border-border bg-bg p-5 shadow-2xl', width, className)}
      >
        <div className="mb-4 flex items-start gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {hint && <p className="text-xs text-muted">{hint}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </Panel>
    </div>
  );
}
