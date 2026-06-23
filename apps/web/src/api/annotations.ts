import type {
  Annotation,
  CreateAnnotationRequest,
  UpdateAnnotationRequest,
} from '@basira/shared';
import { apiFetch } from './client.js';

export const annotationsApi = {
  listForPage: (pageId: string) =>
    apiFetch<Annotation[]>(`/pages/${pageId}/annotations`),

  create: (body: CreateAnnotationRequest) =>
    apiFetch<Annotation>('/annotations', { method: 'POST', body }),

  update: (id: string, body: UpdateAnnotationRequest) =>
    apiFetch<Annotation>(`/annotations/${id}`, { method: 'PATCH', body }),
};
