import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Transcription } from '@basira/shared';
import { pagesApi } from '../../api/pages.js';
import { transcriptionsApi } from '../../api/transcriptions.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useJob } from '../../hooks/useJob.js';
import { useSyncScroll } from '../../lib/syncScroll.js';
import { Button } from '../ui/Button.js';
import { ConfidenceBadge } from './ConfidenceBadge.js';

export function TranscriptionPane({ pageId }: { pageId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const sync = useSyncScroll();
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const versions = useQuery({
    queryKey: ['transcriptions', pageId],
    queryFn: () => pagesApi.listTranscriptions(pageId),
  });

  const selected: Transcription | undefined = useMemo(() => {
    const list = versions.data ?? [];
    return list.find((t) => t.id === selectedId) ?? list.find((t) => t.isCurrent) ?? list[0];
  }, [versions.data, selectedId]);

  // Sync the editor when the selected version changes.
  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setDraft(selected.text);
    }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const job = useJob(jobId);
  useEffect(() => {
    if (job.data?.status === 'done') {
      setJobId(null);
      setSelectedId(null); // re-select the new current version
      qc.invalidateQueries({ queryKey: ['transcriptions', pageId] });
      qc.invalidateQueries({ queryKey: ['page', pageId] });
    }
  }, [job.data?.status, pageId, qc]);

  const transcribe = useMutation({
    mutationFn: () => pagesApi.transcribe(pageId),
    onSuccess: (created) => setJobId(created.id),
  });

  const save = useMutation({
    mutationFn: () =>
      transcriptionsApi.update(selected!.id, {
        // Unicode-normalise on save; preserve line breaks. (§11)
        text: draft.normalize('NFC'),
      }),
    onSuccess: () => {
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ['transcriptions', pageId] });
    },
  });

  const dirty = selected ? draft !== selected.text : draft.length > 0;
  const running =
    transcribe.isPending ||
    (jobId !== null && job.data?.status !== 'failed');

  return (
    <section className="flex h-full flex-col gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="font-serif text-lg font-semibold text-ink-900">
            Transcription
          </h2>
          <span className="text-xs text-ink-700">source script</span>
        </div>
        <div className="flex items-center gap-2">
          {selected && <ConfidenceBadge value={selected.confidence} />}
          {(versions.data?.length ?? 0) > 0 && (
            <select
              value={selected?.id ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-md border border-ink-100 bg-white px-2 py-1 text-xs"
            >
              {versions.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  v{t.version}
                  {t.isCurrent ? ' (current)' : ''} ·{' '}
                  {t.provenance.adapterKey}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <p className="flex items-center gap-1.5 text-[11px] text-gold-600">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-500" />
        Machine-generated draft — requires expert review.
      </p>

      {versions.isLoading && <p className="text-sm text-ink-700">Loading…</p>}

      {!versions.isLoading && (versions.data?.length ?? 0) === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-ink-700">
          <p className="text-sm">No transcription yet.</p>
          {canEdit && (
            <Button onClick={() => transcribe.mutate()} disabled={running}>
              {running ? 'Transcribing…' : 'Generate transcription'}
            </Button>
          )}
        </div>
      )}

      {(versions.data?.length ?? 0) > 0 && (
        <>
          <textarea
            ref={sync.ref}
            onScroll={(e) => sync.onScroll?.(e)}
            dir="rtl"
            lang="ar"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={!canEdit}
            spellCheck={false}
            className="arabic pane-scroll min-h-[22rem] flex-1 resize-none overflow-auto rounded-lg border border-ink-100 bg-ink-50/50 p-4 text-2xl leading-[2.3] outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-700">
            <span>
              {selected && (
                <>
                  {selected.provenance.modelName} ·{' '}
                  {new Date(selected.provenance.generatedAt).toLocaleString()}
                </>
              )}
            </span>
            {canEdit && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => transcribe.mutate()}
                  disabled={running}
                >
                  {running ? 'Re-transcribing…' : 'Re-transcribe'}
                </Button>
                <Button
                  onClick={() => save.mutate()}
                  disabled={!dirty || save.isPending}
                >
                  {save.isPending ? 'Saving…' : 'Save as new version'}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {job.data?.status === 'failed' && (
        <p className="text-sm text-red-600">
          Transcription failed: {job.data.error}
        </p>
      )}
    </section>
  );
}
