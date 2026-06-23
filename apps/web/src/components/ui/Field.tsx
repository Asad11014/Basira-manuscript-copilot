import { clsx } from 'clsx';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
}

/** Labelled text input used across forms. */
export function Field({ label, hint, className, id, ...props }: FieldProps) {
  const inputId = id ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <label htmlFor={inputId} className="block space-y-1">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-md border border-ink-100 bg-white px-3 py-2 text-sm outline-none focus:border-ink-700 focus:ring-1 focus:ring-ink-700',
          className,
        )}
        {...props}
      />
      {hint && <span className="text-xs text-ink-700">{hint}</span>}
    </label>
  );
}
