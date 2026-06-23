import type {
  ImageVariant,
  Job,
  PageDetail,
  TranscribeRequest,
  Transcription,
  TranslateRequest,
} from '@basira/shared';
import { apiFetch, apiUrl } from './client.js';

export const pagesApi = {
  get: (id: string) => apiFetch<PageDetail>(`/pages/${id}`),

  imageUrl: (id: string, variant: ImageVariant = 'original') =>
    apiUrl(`/pages/${id}/image?variant=${variant}`),

  listTranscriptions: (id: string) =>
    apiFetch<Transcription[]>(`/pages/${id}/transcriptions`),

  transcribe: (id: string, body: TranscribeRequest = {}) =>
    apiFetch<Job>(`/pages/${id}/transcribe`, { method: 'POST', body }),

  translate: (id: string, body: TranslateRequest) =>
    apiFetch<Job>(`/pages/${id}/translate`, { method: 'POST', body }),
};

export const jobsApi = {
  get: (id: string) => apiFetch<Job>(`/jobs/${id}`),
};
