import { z } from 'zod';
import { JOB_STATUSES, JOB_TYPES } from '../constants.js';
import { idSchema } from './common.js';

/** Async job row — created BEFORE enqueue so the UI tracks from t=0. (§9) */
export const jobSchema = z.object({
  id: idSchema,
  type: z.enum(JOB_TYPES),
  status: z.enum(JOB_STATUSES),
  /** Polymorphic ref to the entity the job operates on (e.g. pageId). */
  entityRef: z.string(),
  progress: z.number().int().min(0).max(100),
  error: z.string().nullable(),
  adapterKey: z.string().nullable(),
  resultRef: z.string().nullable(),
  /** Parent job id when this is a fan-out child of a batch. (§9) */
  parentJobId: idSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Job = z.infer<typeof jobSchema>;

export const transcribeRequestSchema = z.object({
  adapterKey: z.string().optional(),
  sourceLanguageHint: z.string().optional(),
});
export type TranscribeRequest = z.infer<typeof transcribeRequestSchema>;

export const translateRequestSchema = z.object({
  targetLang: z.string().min(2).max(20),
  adapterKey: z.string().optional(),
  wantGlosses: z.boolean().optional(),
});
export type TranslateRequest = z.infer<typeof translateRequestSchema>;

export const batchRequestSchema = z.object({
  steps: z
    .array(z.enum(['preprocess', 'transcribe', 'translate', 'ner']))
    .min(1),
  targetLang: z.string().min(2).max(20).optional(),
});
export type BatchRequest = z.infer<typeof batchRequestSchema>;
