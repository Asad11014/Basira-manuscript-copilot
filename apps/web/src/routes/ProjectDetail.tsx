import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.js';
import { manuscriptsApi } from '../api/manuscripts.js';
import { useAuth } from '../hooks/useAuth.js';
import { UploadManuscript } from '../components/upload/UploadManuscript.js';
import { GlossaryEditor } from '../components/GlossaryEditor.js';

export function ProjectDetailRoute() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
  });
  const manuscripts = useQuery({
    queryKey: ['manuscripts', id],
    queryFn: () => manuscriptsApi.listByProject(id),
  });

  return (
    <div className="space-y-6">
      <nav className="text-sm text-ink-700">
        <Link to="/projects" className="hover:underline">
          Projects
        </Link>{' '}
        / <span>{project.data?.name ?? '…'}</span>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project.data?.name ?? 'Project'}
        </h1>
        {project.data?.description && (
          <p className="text-ink-700">{project.data.description}</p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-700">
            Manuscripts
          </h2>
          {manuscripts.isLoading && <p className="text-ink-700">Loading…</p>}
          {manuscripts.data?.length === 0 && (
            <p className="text-ink-700">No manuscripts yet. Upload one →</p>
          )}
          <ul className="space-y-2">
            {manuscripts.data?.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/manuscript/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-ink-100 bg-white p-4 shadow-sm transition hover:border-ink-700"
                >
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-ink-700">
                      {m.sourceLanguage} · {m.script} · {m.pageCount} pages
                    </p>
                  </div>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {canEdit && (
          <aside className="space-y-4">
            <UploadManuscript projectId={id} />
            {project.data && <GlossaryEditor project={project.data} />}
          </aside>
        )}
      </div>
    </div>
  );
}
