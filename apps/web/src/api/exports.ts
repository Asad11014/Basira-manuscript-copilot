import type { CreateExportRequest, Job } from '@basira/shared';
import { apiFetch, apiUrl } from './client.js';

export const exportsApi = {
  create: (body: CreateExportRequest) =>
    apiFetch<Job>('/exports', { method: 'POST', body }),

  downloadUrl: (artifactId: string) =>
    apiUrl(`/exports/${artifactId}/download`),
};
