import type { SearchResults, SearchScope } from '@basira/shared';
import { apiFetch } from './client.js';

export const searchApi = {
  search: (params: { q: string; projectId?: string; scope?: SearchScope }) =>
    apiFetch<SearchResults>('/search', {
      query: { q: params.q, projectId: params.projectId, scope: params.scope },
    }),
};
