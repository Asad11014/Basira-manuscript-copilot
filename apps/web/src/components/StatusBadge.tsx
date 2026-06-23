import { clsx } from 'clsx';
import type { PageStatus } from '@basira/shared';

const STYLES: Record<PageStatus, string> = {
  uploaded: 'bg-amber-100 text-amber-800',
  preprocessed: 'bg-sky-100 text-sky-800',
  transcribed: 'bg-violet-100 text-violet-800',
  translated: 'bg-green-100 text-green-800',
};

const LABELS: Record<PageStatus, string> = {
  uploaded: 'Processing…',
  preprocessed: 'Ready',
  transcribed: 'Transcribed',
  translated: 'Translated',
};

export function StatusBadge({ status }: { status: PageStatus }) {
  return (
    <span
      className={clsx(
        'rounded px-1.5 py-0.5 text-xs font-medium',
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
