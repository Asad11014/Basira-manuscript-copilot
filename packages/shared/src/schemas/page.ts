import { z } from 'zod';
import { PAGE_STATUSES } from '../constants.js';
import { idSchema } from './common.js';
import { regionSchema } from './region.js';

export const pageSchema = z.object({
  id: idSchema,
  manuscriptId: idSchema,
  index: z.number().int().min(0),
  originalImageKey: z.string(),
  processedImageKey: z.string().nullable(),
  hasThumbnail: z.boolean(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  status: z.enum(PAGE_STATUSES),
  /** Refs to the current (isCurrent) versioned artefacts, when present. */
  currentTranscriptionId: idSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Page = z.infer<typeof pageSchema>;

/** Page detail returned by GET /pages/:id — includes regions. (§10) */
export const pageDetailSchema = pageSchema.extend({
  regions: z.array(regionSchema),
});
export type PageDetail = z.infer<typeof pageDetailSchema>;
