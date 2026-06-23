import type {
  CreateProjectRequest,
  Paginated,
  Project,
  UpdateProjectRequest,
} from '@basira/shared';
import { apiFetch } from './client.js';

export const projectsApi = {
  list: (cursor?: string) =>
    apiFetch<Paginated<Project>>('/projects', { query: { cursor } }),

  get: (id: string) => apiFetch<Project>(`/projects/${id}`),

  create: (body: CreateProjectRequest) =>
    apiFetch<Project>('/projects', { method: 'POST', body }),

  update: (id: string, body: UpdateProjectRequest) =>
    apiFetch<Project>(`/projects/${id}`, { method: 'PATCH', body }),
};
