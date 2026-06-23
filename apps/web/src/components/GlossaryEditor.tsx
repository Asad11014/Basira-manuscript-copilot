import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project } from '@basira/shared';
import { projectsApi } from '../api/projects.js';
import { Button } from './ui/Button.js';
import { Field } from './ui/Field.js';

type Entry = { term: string; gloss: string };

/**
 * Edit the per-project glossary that is injected into the translation prompt.
 * This is the MVP form of "learns from scholarly edits". (§8)
 */
export function GlossaryEditor({ project }: { project: Project }) {
  const qc = useQueryClient();
  const [entries, setEntries] = useState<Entry[]>(project.glossary);

  useEffect(() => setEntries(project.glossary), [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: (glossary: Entry[]) =>
      projectsApi.update(project.id, { glossary }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', project.id] }),
  });

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const term = String(form.get('term')).trim();
    const gloss = String(form.get('gloss')).trim();
    if (!term || !gloss) return;
    const next = [...entries.filter((x) => x.term !== term), { term, gloss }];
    setEntries(next);
    save.mutate(next);
    e.currentTarget.reset();
  }

  function remove(term: string) {
    const next = entries.filter((x) => x.term !== term);
    setEntries(next);
    save.mutate(next);
  }

  return (
    <div className="space-y-3 rounded-lg border border-ink-100 bg-white p-5 shadow-sm">
      <h3 className="font-medium">Glossary</h3>
      <p className="text-xs text-ink-700">
        Preferred renderings injected into translations for this project.
      </p>
      <ul className="space-y-1 text-sm">
        {entries.map((g) => (
          <li key={g.term} className="flex items-center justify-between gap-2">
            <span>
              <span className="arabic font-medium">{g.term}</span> → {g.gloss}
            </span>
            <button
              type="button"
              onClick={() => remove(g.term)}
              className="text-xs text-red-600 hover:underline"
            >
              remove
            </button>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-xs text-ink-700">No terms yet.</li>
        )}
      </ul>
      <form onSubmit={add} className="grid grid-cols-2 gap-2">
        <Field label="Term" name="term" />
        <Field label="Gloss" name="gloss" />
        <div className="col-span-2">
          <Button type="submit" variant="secondary" disabled={save.isPending}>
            Add term
          </Button>
        </div>
      </form>
    </div>
  );
}
