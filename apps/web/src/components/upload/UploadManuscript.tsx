import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { manuscriptsApi } from '../../api/manuscripts.js';
import { ApiRequestError } from '../../api/client.js';
import { Button } from '../ui/Button.js';
import { Field } from '../ui/Field.js';

const LANGS = [
  { value: 'ar', label: 'Arabic' },
  { value: 'fa', label: 'Persian' },
  { value: 'ota', label: 'Ottoman Turkish' },
];

/** Upload form for a new manuscript (PDF / image / ZIP of images). */
export function UploadManuscript({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: ({ form, file }: { form: FormData; file: File }) =>
      manuscriptsApi.create(
        {
          projectId,
          title: String(form.get('title')),
          sourceLanguage: String(form.get('sourceLanguage')),
          script: String(form.get('script')),
        },
        file,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manuscripts', projectId] });
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (err) =>
      setError(err instanceof ApiRequestError ? err.message : 'Upload failed'),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Choose a file to upload');
      return;
    }
    upload.mutate({ form, file });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-ink-100 bg-white p-5 shadow-sm"
    >
      <h3 className="font-medium">Upload a manuscript</h3>
      <Field label="Title" name="title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-ink-700">Source language</span>
          <select
            name="sourceLanguage"
            defaultValue="ar"
            className="w-full rounded-md border border-ink-100 bg-white px-3 py-2 text-sm"
          >
            {LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Script" name="script" defaultValue="naskh" required />
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink-700">
          File (PDF, image, or ZIP of images)
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.webp,.zip"
          className="block w-full text-sm"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={upload.isPending}>
        {upload.isPending ? 'Uploading & splitting…' : 'Upload'}
      </Button>
    </form>
  );
}
