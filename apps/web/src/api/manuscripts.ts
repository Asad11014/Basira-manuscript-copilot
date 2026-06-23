import type {
  Manuscript,
  ManuscriptDetail,
  CreateManuscriptRequest,
  BatchRequest,
  Job,
} from '@basira/shared';
import { apiFetch } from './client.js';

export const manuscriptsApi = {
  listByProject: (projectId: string) =>
    apiFetch<Manuscript[]>(`/projects/${projectId}/manuscripts`),

  get: (id: string) => apiFetch<ManuscriptDetail>(`/manuscripts/${id}`),

  batch: (id: string, body: BatchRequest) =>
    apiFetch<Job>(`/manuscripts/${id}/batch`, { method: 'POST', body }),

  create: (input: CreateManuscriptRequest, file: File) => {
    const form = new FormData();
    form.set('projectId', input.projectId);
    form.set('title', input.title);
    form.set('sourceLanguage', input.sourceLanguage);
    form.set('script', input.script);
    if (input.metadata) form.set('metadata', JSON.stringify(input.metadata));
    form.set('file', file);
    return apiFetch<ManuscriptDetail>('/manuscripts', {
      method: 'POST',
      formData: form,
    });
  },
};
