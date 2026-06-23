import { clsx } from 'clsx';

/** Confidence indicator (§ FR-6). Null = adapter did not report a score. */
export function ConfidenceBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return (
      <span className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-700">
        confidence n/a
      </span>
    );
  }
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.85
      ? 'bg-green-100 text-green-800'
      : value >= 0.6
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';
  return (
    <span className={clsx('rounded px-1.5 py-0.5 text-xs font-medium', tone)}>
      {pct}% confidence
    </span>
  );
}
