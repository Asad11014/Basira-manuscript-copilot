import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Translation } from '@basira/shared';
import { pagesApi } from '../../api/pages.js';
import { translationsApi } from '../../api/translations.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useJob } from '../../hooks/useJob.js';
import { useSyncScroll } from '../../lib/syncScroll.js';
import { Button } from '../ui/Button.js';

const TARGET_LANGS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

interface Props {
  pageId: string;
  transcriptionId: string | null;
}

export function TranslationPane({ pageId, transcriptionId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const sync = useSyncScroll();
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const [targetLang, setTargetLang] = useState('en');
  const [jobId, setJobId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const translations = useQuery({
    queryKey: ['translations', transcriptionId],
    queryFn: () => translationsApi.listForTranscription(transcriptionId as string),
    enabled: transcriptionId !== null,
  });

  const selected: Translation | undefined = useMemo(() => {
    const forLang = (translations.data ?? []).filter(
      (t) => t.targetLang === targetLang,
    );
    return forLang.find((t) => t.isCurrent) ?? forLang[0];
  }, [translations.data, targetLang]);

  useEffect(() => {
    setDraft(selected?.text ?? '');
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const job = useJob(jobId);
  useEffect(() => {
    if (job.data?.status === 'done') {
      setJobId(null);
      qc.invalidateQueries({ queryKey: ['translations', transcriptionId] });
      qc.invalidateQueries({ queryKey: ['page', pageId] });
    }
  }, [job.data?.status, transcriptionId, pageId, qc]);

  const translate = useMutation({
    mutationFn: () => pagesApi.translate(pageId, { targetLang, wantGlosses: true }),
    onSuccess: (created) => setJobId(created.id),
  });

  const save = useMutation({
    mutationFn: () =>
      translationsApi.update(selected!.id, { text: draft.normalize('NFC') }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['translations', transcriptionId] }),
  });

  const running =
    translate.isPending || (jobId !== null && job.data?.status !== 'failed');
  const dirty = selected ? draft !== selected.text : false;

  if (!transcriptionId) {
    return (
      <section className="flex h-full min-h-[16rem] items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white p-6 text-center text-sm text-ink-700 shadow-card">
        Generate a transcription first, then translate it.
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="font-serif text-lg font-semibold text-ink-900">
            Translation
          </h2>
          <span className="text-xs text-ink-700">target language</span>
        </div>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="rounded-md border border-ink-100 bg-white px-2 py-1 text-xs"
        >
          {TARGET_LANGS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </header>

      <p className="flex items-center gap-1.5 text-[11px] text-gold-600">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-500" />
        Machine-generated draft — requires expert review.
      </p>

      {!selected && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-ink-700">
          <p className="text-sm">No {targetLang} translation yet.</p>
          {canEdit && (
            <Button onClick={() => translate.mutate()} disabled={running}>
              {running ? 'Translating…' : 'Generate translation'}
            </Button>
          )}
        </div>
      )}

      {selected && (
        <>
          <textarea
            ref={sync.ref}
            onScroll={(e) => sync.onScroll?.(e)}
            dir="ltr"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={!canEdit}
            className="pane-scroll min-h-[22rem] flex-1 resize-none overflow-auto rounded-lg border border-ink-100 bg-ink-50/50 p-4 text-lg leading-relaxed outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />

          {selected.glosses && selected.glosses.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-ink-700">
                Glossary ({selected.glosses.length})
              </summary>
              <ul className="mt-1 space-y-0.5">
                {selected.glosses.map((g, i) => (
                  <li key={i}>
                    <span className="arabic font-medium">{g.term}</span> —{' '}
                    {g.gloss}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-700">
            <span>
              {selected.provenance.modelName}
              {selected.alignment
                ? ` · ${selected.alignment.length} aligned passages`
                : ''}
            </span>
            {canEdit && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => translate.mutate()}
                  disabled={running}
                >
                  {running ? 'Re-translating…' : 'Re-translate'}
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
          Translation failed: {job.data.error}
        </p>
      )}
    </section>
  );
}
