import type { Translation, UpdateTranslationRequest } from '@basira/shared';
import { apiFetch } from './client.js';

export const translationsApi = {
  listForTranscription: (transcriptionId: string) =>
    apiFetch<Translation[]>(`/transcriptions/${transcriptionId}/translations`),

  update: (id: string, body: UpdateTranslationRequest) =>
    apiFetch<Translation>(`/translations/${id}`, { method: 'PUT', body }),
};
