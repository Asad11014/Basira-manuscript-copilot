import { z } from 'zod';
import { idSchema, provenanceSchema } from './common.js';

export const alignmentPairSchema = z.object({
  source: z.string(),
  target: z.string(),
});
export const glossSchema = z.object({ term: z.string(), gloss: z.string() });

/** A versioned translation of a transcription into a target language. (§7) */
export const translationSchema = z.object({
  id: idSchema,
  transcriptionId: idSchema,
  version: z.number().int().min(1),
  targetLang: z.string(),
  text: z.string(),
  /** source passage <-> target passage alignment. */
  alignment: z.array(alignmentPairSchema).nullable(),
  glosses: z.array(glossSchema).nullable(),
  provenance: provenanceSchema,
  createdByUserId: idSchema.nullable(),
  isCurrent: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Translation = z.infer<typeof translationSchema>;

export const updateTranslationRequestSchema = z.object({
  text: z.string(),
  alignment: z.array(alignmentPairSchema).optional(),
});
export type UpdateTranslationRequest = z.infer<
  typeof updateTranslationRequestSchema
>;
