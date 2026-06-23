import type { Entity, Job } from '@basira/shared';
import { apiFetch } from './client.js';

export const entitiesApi = {
  listForPage: (pageId: string) =>
    apiFetch<Entity[]>(`/pages/${pageId}/entities`),

  detect: (pageId: string) =>
    apiFetch<Job>(`/pages/${pageId}/ner`, { method: 'POST', body: {} }),
};
