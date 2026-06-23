import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import type { AnnotationKind } from '@basira/shared';
import { annotationsApi } from '../../api/annotations.js';
import { Button } from '../ui/Button.js';

const KIND_LABELS: Record<AnnotationKind, string> = {
  comment: 'Comment',
  gloss: 'Glossary',
  citationFlag: 'Citation flag',
  uncertainFlag: 'Uncertain reading',
};

const KIND_STYLES: Record<AnnotationKind, string> = {
  comment: 'bg-sky-100 text-sky-800',
  gloss: 'bg-violet-100 text-violet-800',
  citationFlag: 'bg-emerald-100 text-emerald-800',
  uncertainFlag: 'bg-amber-100 text-amber-800',
};

export function AnnotationRail({ pageId }: { pageId: string }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<AnnotationKind>('comment');

  const annotations = useQuery({
    queryKey: ['annotations', pageId],
    queryFn: () => annotationsApi.listForPage(pageId),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['annotations', pageId] });

  const create = useMutation({
    mutationFn: (body: string) =>
      annotationsApi.create({ pageId, kind, body, anchor: {} }),
    onSuccess: invalidate,
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; resolved: boolean }) =>
      annotationsApi.update(v.id, { resolved: v.resolved }),
    onSuccess: invalidate,
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get('body')).trim();
    if (body) create.mutate(body, { onSuccess: () => form.reset() });
  }

  return (
    <section className="space-y-3 rounded-lg border border-ink-100 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-medium uppercase tracking-wide text-ink-700">
        Annotations
      </h2>

      <form onSubmit={submit} className="space-y-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as AnnotationKind)}
          className="w-full rounded-md border border-ink-100 bg-white px-2 py-1 text-xs"
        >
          {(Object.keys(KIND_LABELS) as AnnotationKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <textarea
          name="body"
          required
          rows={2}
          placeholder="Add a note, gloss, or flag…"
          className="w-full resize-none rounded-md border border-ink-100 px-2 py-1 text-sm outline-none focus:border-ink-700"
        />
        <Button type="submit" variant="secondary" disabled={create.isPending}>
          {create.isPending ? 'Adding…' : 'Add annotation'}
        </Button>
      </form>

      <ul className="space-y-2">
        {annotations.data?.length === 0 && (
          <li className="text-xs text-ink-700">No annotations yet.</li>
        )}
        {annotations.data?.map((a) => (
          <li
            key={a.id}
            className={clsx(
              'rounded-md border border-ink-100 p-2 text-sm',
              a.resolved && 'opacity-60',
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span
                className={clsx(
                  'rounded px-1.5 py-0.5 text-xs font-medium',
                  KIND_STYLES[a.kind],
                )}
              >
                {KIND_LABELS[a.kind]}
              </span>
              <button
                type="button"
                onClick={() => toggle.mutate({ id: a.id, resolved: !a.resolved })}
                className="text-xs text-ink-700 hover:underline"
              >
                {a.resolved ? 'Reopen' : 'Resolve'}
              </button>
            </div>
            <p className="whitespace-pre-wrap">{a.body}</p>
            <p className="mt-1 text-xs text-ink-700">— {a.userName}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
