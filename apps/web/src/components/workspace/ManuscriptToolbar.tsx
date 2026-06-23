import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EXPORT_FORMATS, type ExportFormat } from '@basira/shared';
import { apiUrl } from '../../api/client.js';
import { exportsApi } from '../../api/exports.js';
import { manuscriptsApi } from '../../api/manuscripts.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useJob } from '../../hooks/useJob.js';
import { Button } from '../ui/Button.js';

export function ManuscriptToolbar({ manuscriptId }: { manuscriptId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const [format, setFormat] = useState<ExportFormat>('docx');
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);

  const exportJob = useJob(exportJobId);
  useEffect(() => {
    if (exportJob.data?.status === 'done') {
      const artifactId = exportJob.data.resultRef;
      setExportJobId(null);
      if (artifactId) window.open(exportsApi.downloadUrl(artifactId), '_blank');
    }
  }, [exportJob.data?.status]);

  const batchJob = useJob(batchJobId);
  useEffect(() => {
    if (batchJob.data?.status === 'done') {
      setBatchJobId(null);
      qc.invalidateQueries({ queryKey: ['manuscript', manuscriptId] });
    }
  }, [batchJob.data?.status, manuscriptId, qc]);

  const runExport = useMutation({
    mutationFn: () => exportsApi.create({ manuscriptId, format }),
    onSuccess: (j) => setExportJobId(j.id),
  });
  const runBatch = useMutation({
    mutationFn: () =>
      manuscriptsApi.batch(manuscriptId, {
        steps: ['preprocess', 'transcribe'],
        targetLang: 'en',
      }),
    onSuccess: (j) => setBatchJobId(j.id),
  });

  const exporting =
    runExport.isPending ||
    (exportJobId !== null && exportJob.data?.status !== 'failed');
  const batching =
    runBatch.isPending ||
    (batchJobId !== null && batchJob.data?.status !== 'failed');

  if (!canEdit) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit && (
        <Button
          variant="secondary"
          onClick={() => runBatch.mutate()}
          disabled={batching}
          title="Preprocess + transcribe every page"
        >
          {batching
            ? `Batch… ${batchJob.data?.progress ?? 0}%`
            : 'Batch transcribe all'}
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={() =>
          window.open(apiUrl(`/manuscripts/${manuscriptId}/ground-truth`), '_blank')
        }
        title="Download Kraken-trainable line data (your corrected pages)"
      >
        Training data
      </Button>
      <div className="flex items-center gap-1">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          className="rounded-md border border-ink-100 bg-white px-2 py-2 text-sm"
        >
          {EXPORT_FORMATS.map((f) => (
            <option key={f} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </select>
        <Button onClick={() => runExport.mutate()} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export'}
        </Button>
      </div>
    </div>
  );
}
