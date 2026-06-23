import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ENTITY_TYPES, type EntityType } from '@basira/shared';
import { entitiesApi } from '../../api/entities.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useJob } from '../../hooks/useJob.js';
import { Button } from '../ui/Button.js';

const TYPE_LABELS: Record<EntityType, string> = {
  person: 'People',
  work: 'Works',
  place: 'Places',
  citation: 'Citations',
};
const TYPE_STYLES: Record<EntityType, string> = {
  person: 'bg-sky-100 text-sky-800',
  work: 'bg-violet-100 text-violet-800',
  place: 'bg-emerald-100 text-emerald-800',
  citation: 'bg-amber-100 text-amber-800',
};

interface Props {
  pageId: string;
  hasTranscription: boolean;
}

export function EntitiesPanel({ pageId, hasTranscription }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const [jobId, setJobId] = useState<string | null>(null);

  const entities = useQuery({
    queryKey: ['entities', pageId],
    queryFn: () => entitiesApi.listForPage(pageId),
  });

  const job = useJob(jobId);
  useEffect(() => {
    if (job.data?.status === 'done') {
      setJobId(null);
      qc.invalidateQueries({ queryKey: ['entities', pageId] });
    }
  }, [job.data?.status, pageId, qc]);

  const detect = useMutation({
    mutationFn: () => entitiesApi.detect(pageId),
    onSuccess: (j) => setJobId(j.id),
  });

  const running =
    detect.isPending || (jobId !== null && job.data?.status !== 'failed');

  return (
    <section className="space-y-3 rounded-lg border border-ink-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-700">
          Named entities
        </h2>
        {canEdit && hasTranscription && (
          <Button variant="secondary" onClick={() => detect.mutate()} disabled={running}>
            {running ? 'Detecting…' : 'Detect entities'}
          </Button>
        )}
      </div>

      {!hasTranscription && (
        <p className="text-xs text-ink-700">Transcribe the page first.</p>
      )}
      {entities.data?.length === 0 && hasTranscription && (
        <p className="text-xs text-ink-700">No entities detected yet.</p>
      )}

      <div className="space-y-2">
        {ENTITY_TYPES.map((type) => {
          const items = entities.data?.filter((e) => e.type === type) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={type}>
              <p className="mb-1 text-xs font-medium text-ink-700">
                {TYPE_LABELS[type]}
              </p>
              <div className="flex flex-wrap gap-1">
                {items.map((e) => (
                  <span
                    key={e.id}
                    title={e.normalizedName ?? undefined}
                    className={clsx(
                      'rounded px-1.5 py-0.5 text-xs',
                      TYPE_STYLES[type],
                    )}
                  >
                    <span className="arabic">{e.surfaceText}</span>
                    {e.normalizedName ? ` · ${e.normalizedName}` : ''}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {job.data?.status === 'failed' && (
        <p className="text-sm text-red-600">Detection failed: {job.data.error}</p>
      )}
    </section>
  );
}
