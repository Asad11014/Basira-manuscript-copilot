import { z } from 'zod';
import { REGION_TYPES } from '../constants.js';
import { bboxSchema, idSchema } from './common.js';

/** A detected layout area on a page (text block, line, marginal note). (§7) */
export const regionSchema = z.object({
  id: idSchema,
  pageId: idSchema,
  type: z.enum(REGION_TYPES),
  bbox: bboxSchema,
  order: z.number().int().min(0),
});
export type Region = z.infer<typeof regionSchema>;
