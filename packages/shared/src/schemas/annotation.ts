import { z } from 'zod';
import { ANNOTATION_KINDS } from '../constants.js';
import { idSchema } from './common.js';

/** Where an annotation is anchored: a region and/or a character span. (§7) */
export const anchorSchema = z.object({
  regionId: idSchema.optional(),
  span: z.tuple([z.number().int(), z.number().int()]).optional(),
});
export type Anchor = z.infer<typeof anchorSchema>;

export const annotationSchema = z.object({
  id: idSchema,
  pageId: idSchema.nullable(),
  transcriptionId: idSchema.nullable(),
  userId: idSchema,
  userName: z.string(),
  kind: z.enum(ANNOTATION_KINDS),
  body: z.string(),
  anchor: anchorSchema,
  resolved: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Annotation = z.infer<typeof annotationSchema>;

export const createAnnotationRequestSchema = z
  .object({
    pageId: idSchema.optional(),
    transcriptionId: idSchema.optional(),
    kind: z.enum(ANNOTATION_KINDS),
    body: z.string().min(1).max(5000),
    anchor: anchorSchema.default({}),
  })
  .refine((v) => v.pageId || v.transcriptionId, {
    message: 'Either pageId or transcriptionId is required',
  });
export type CreateAnnotationRequest = z.infer<
  typeof createAnnotationRequestSchema
>;

export const updateAnnotationRequestSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  resolved: z.boolean().optional(),
});
export type UpdateAnnotationRequest = z.infer<
  typeof updateAnnotationRequestSchema
>;
