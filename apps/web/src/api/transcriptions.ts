import type { Transcription, UpdateTranscriptionRequest } from '@basira/shared';
import { apiFetch } from './client.js';

export const transcriptionsApi = {
  update: (id: string, body: UpdateTranscriptionRequest) =>
    apiFetch<Transcription>(`/transcriptions/${id}`, { method: 'PUT', body }),
};
