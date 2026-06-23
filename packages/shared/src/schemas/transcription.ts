import { z } from 'zod';
import { idSchema, provenanceSchema } from './common.js';

/**
 * A versioned transcription. Append-only: editing creates a new version and
 * flips `isCurrent`. Always carries provenance. (§7, §8)
 */
export const transcriptionSchema = z.object({
  id: idSchema,
  pageId: idSchema,
  version: z.number().int().min(1),
  text: z.string(),
  /** regionId -> text, when the adapter produced per-region output. */
  perRegionText: z.record(z.string()).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  provenance: provenanceSchema,
  createdByUserId: idSchema.nullable(),
  isCurrent: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Transcription = z.infer<typeof transcriptionSchema>;

/** Human edit → creates a new version. (FR-7) */
export const updateTranscriptionRequestSchema = z.object({
  text: z.string(),
  perRegionText: z.record(z.string()).optional(),
});
export type UpdateTranscriptionRequest = z.infer<
  typeof updateTranscriptionRequestSchema
>;
