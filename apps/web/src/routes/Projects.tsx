import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.js';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.js';
import { Field } from '../components/ui/Field.js';

export function ProjectsRoute() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const create = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setCreating(false);
    },
  });

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    create.mutate({
      name: String(form.get('name')),
      description: String(form.get('description')) || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink-900">
            Projects
          </h1>
          <p className="text-sm text-ink-700">
            Organise manuscripts into collections.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? 'Cancel' : 'New project'}
          </Button>
        )}
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-ink-100 bg-white p-5 shadow-sm"
        >
          <Field label="Name" name="name" required />
          <Field label="Description" name="description" />
          {create.isError && (
            <p className="text-sm text-red-600">Could not create project.</p>
          )}
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create project'}
          </Button>
        </form>
      )}

      {projects.isLoading && <p className="text-ink-700">Loading projects…</p>}
      {projects.data?.items.length === 0 && (
        <p className="text-ink-700">No projects yet.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.data?.items.map((p) => (
          <li key={p.id}>
            <Link
              to={`/project/${p.id}`}
              className="block h-full rounded-xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-600"
            >
              <h2 className="font-serif text-lg font-semibold text-ink-900">
                {p.name}
              </h2>
              {p.description && (
                <p className="mt-1 line-clamp-2 text-sm text-ink-700">
                  {p.description}
                </p>
              )}
              {p.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-ink-100 px-1.5 py-0.5 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
