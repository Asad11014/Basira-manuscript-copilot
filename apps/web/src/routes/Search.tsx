import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SEARCH_SCOPES, type SearchScope } from '@basira/shared';
import { searchApi } from '../api/search.js';
import { Button } from '../components/ui/Button.js';

export function SearchRoute() {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<SearchScope | ''>('');
  const [submitted, setSubmitted] = useState<{ q: string; scope?: SearchScope }>();

  const results = useQuery({
    queryKey: ['search', submitted],
    queryFn: () =>
      searchApi.search({
        q: submitted!.q,
        scope: submitted!.scope,
      }),
    enabled: !!submitted?.q,
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (q.trim()) setSubmitted({ q: q.trim(), scope: scope || undefined });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search transcriptions, translations, annotations…"
          className="flex-1 rounded-md border border-ink-100 px-3 py-2 text-sm outline-none focus:border-ink-700"
        />
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as SearchScope | '')}
          className="rounded-md border border-ink-100 bg-white px-2 py-2 text-sm"
        >
          <option value="">All content</option>
          {SEARCH_SCOPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      {results.isLoading && <p className="text-ink-700">Searching…</p>}
      {results.data && results.data.hits.length === 0 && (
        <p className="text-ink-700">No matches for “{results.data.query}”.</p>
      )}

      <ul className="space-y-2">
        {results.data?.hits.map((h, i) => (
          <li key={i}>
            <Link
              to={`/page/${h.pageId}`}
              className="block rounded-lg border border-ink-100 bg-white p-4 shadow-sm transition hover:border-ink-700"
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-ink-700">
                <span className="rounded bg-ink-100 px-1.5 py-0.5">{h.scope}</span>
                <span>
                  {h.manuscriptTitle} · page {h.pageIndex + 1}
                </span>
              </div>
              <p
                className={
                  h.scope === 'transcription' ? 'arabic text-base' : 'text-sm'
                }
              >
                {h.snippet}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
