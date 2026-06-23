import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pagesApi } from '../api/pages.js';
import { ImagePane } from '../components/workspace/ImagePane.js';
import { TranscriptionPane } from '../components/editor/TranscriptionPane.js';
import { TranslationPane } from '../components/review/TranslationPane.js';
import { AnnotationRail } from '../components/review/AnnotationRail.js';
import { EntitiesPanel } from '../components/review/EntitiesPanel.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { SyncScrollProvider } from '../lib/syncScroll.js';

export function PageWorkspaceRoute() {
  const { id = '' } = useParams();
  const [focusedRegionId, setFocusedRegionId] = useState<string | null>(null);

  const page = useQuery({
    queryKey: ['page', id],
    queryFn: () => pagesApi.get(id),
    refetchInterval: (q) => (q.state.data?.status === 'uploaded' ? 2000 : false),
  });
  const data = page.data;

  return (
    <div className="space-y-4">
      <nav className="flex items-center justify-between text-sm text-ink-700">
        <span>
          {data && (
            <Link
              to={`/manuscript/${data.manuscriptId}`}
              className="font-medium text-brand-700 hover:underline"
            >
              ← Back to manuscript
            </Link>
          )}
        </span>
        {data && <StatusBadge status={data.status} />}
      </nav>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Image — slim sticky column */}
        <div className="xl:col-span-3">
          <section className="pane-scroll overflow-auto rounded-xl border border-ink-100 bg-white p-2 shadow-card xl:sticky xl:top-20 xl:max-h-[80vh]">
            {data ? (
              <ImagePane
                pageId={data.id}
                regions={data.regions}
                focusedRegionId={focusedRegionId}
                onFocusRegion={setFocusedRegionId}
              />
            ) : (
              <p className="p-6 text-ink-700">Loading page…</p>
            )}
          </section>
        </div>

        {/* Source + translation — the focus, given the most room */}
        {data && (
          <SyncScrollProvider>
            <div className="xl:col-span-5 xl:h-[80vh]">
              <TranscriptionPane pageId={data.id} />
            </div>
            <div className="xl:col-span-4 xl:h-[80vh]">
              <TranslationPane
                pageId={data.id}
                transcriptionId={data.currentTranscriptionId}
              />
            </div>
          </SyncScrollProvider>
        )}
      </div>

      {data && (
        <div className="grid gap-5 lg:grid-cols-2">
          <EntitiesPanel
            pageId={data.id}
            hasTranscription={data.currentTranscriptionId !== null}
          />
          <AnnotationRail pageId={data.id} />
        </div>
      )}
    </div>
  );
}
