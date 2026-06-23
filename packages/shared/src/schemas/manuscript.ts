import { z } from 'zod';
import { idSchema } from './common.js';
import { pageSchema } from './page.js';

export const manuscriptSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  title: z.string().min(1).max(300),
  sourceLanguage: z.string().min(1).max(20),
  script: z.string().min(1).max(50),
  metadata: z.record(z.unknown()),
  originalFileKey: z.string().nullable(),
  /** Groups multiple witnesses of the same work for variant comparison (FR-21). */
  witnessGroupId: idSchema.nullable(),
  pageCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Manuscript = z.infer<typeof manuscriptSchema>;

/**
 * Manuscript creation is multipart (file + fields). This schema validates the
 * text fields; the file is handled by the upload middleware. (§10)
 */
export const createManuscriptRequestSchema = z.object({
  projectId: idSchema,
  title: z.string().min(1).max(300),
  sourceLanguage: z.string().min(1).max(20),
  script: z.string().min(1).max(50),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateManuscriptRequest = z.infer<
  typeof createManuscriptRequestSchema
>;

/** Manuscript detail returned by GET /manuscripts/:id — includes pages. (§10) */
export const manuscriptDetailSchema = manuscriptSchema.extend({
  pages: z.array(pageSchema),
});
export type ManuscriptDetail = z.infer<typeof manuscriptDetailSchema>;
