import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { manuscriptsApi } from '../api/manuscripts.js';
import { pagesApi } from '../api/pages.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ManuscriptToolbar } from '../components/workspace/ManuscriptToolbar.js';

export function ManuscriptWorkspaceRoute() {
  const { id = '' } = useParams();

  const manuscript = useQuery({
    queryKey: ['manuscript', id],
    queryFn: () => manuscriptsApi.get(id),
    // While any page is still preprocessing, keep refreshing so thumbnails and
    // statuses fill in automatically. (§11 zero-friction)
    refetchInterval: (q) =>
      q.state.data?.pages.some((p) => p.status === 'uploaded') ? 2000 : false,
  });

  const data = manuscript.data;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-ink-700">
        <Link to="/projects" className="hover:underline">
          Projects
        </Link>{' '}
        /{' '}
        {data && (
          <Link to={`/project/${data.projectId}`} className="hover:underline">
            Project
          </Link>
        )}{' '}
        / <span>{data?.title ?? '…'}</span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink-900">
            {data?.title ?? 'Manuscript'}
          </h1>
          {data && (
            <p className="text-sm text-ink-700">
              {data.sourceLanguage} · {data.script} · {data.pageCount} pages
            </p>
          )}
        </div>
        {data && <ManuscriptToolbar manuscriptId={data.id} />}
      </header>

      {manuscript.isLoading && <p className="text-ink-700">Loading pages…</p>}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {data?.pages.map((page) => (
          <li key={page.id}>
            <Link
              to={`/page/${page.id}`}
              className="block overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-brand-600"
            >
              <div className="flex aspect-[3/4] items-center justify-center bg-ink-100">
                {page.hasThumbnail ? (
                  <img
                    src={pagesApi.imageUrl(page.id, 'thumbnail')}
                    alt={`Page ${page.index + 1}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs text-ink-700">Processing…</span>
                )}
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium">
                  Page {page.index + 1}
                </span>
                <StatusBadge status={page.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
