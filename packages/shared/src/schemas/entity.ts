import { z } from 'zod';
import { ENTITY_TYPES } from '../constants.js';
import { idSchema, provenanceSchema } from './common.js';

/** A detected named entity (person/work/place/citation). (§7, FR-10) */
export const entitySchema = z.object({
  id: idSchema,
  pageId: idSchema,
  transcriptionId: idSchema.nullable(),
  type: z.enum(ENTITY_TYPES),
  surfaceText: z.string(),
  normalizedName: z.string().nullable(),
  /** [start, end] character span into the transcription text. */
  span: z.tuple([z.number().int(), z.number().int()]).nullable(),
  provenance: provenanceSchema,
  createdAt: z.string().datetime(),
});
export type Entity = z.infer<typeof entitySchema>;
