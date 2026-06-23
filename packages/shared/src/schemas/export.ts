import { z } from 'zod';
import { EXPORT_FORMATS } from '../constants.js';
import { idSchema } from './common.js';

export const createExportRequestSchema = z
  .object({
    manuscriptId: idSchema.optional(),
    projectId: idSchema.optional(),
    format: z.enum(EXPORT_FORMATS),
  })
  .refine((v) => v.manuscriptId || v.projectId, {
    message: 'Either manuscriptId or projectId is required',
  });
export type CreateExportRequest = z.infer<typeof createExportRequestSchema>;

export const exportArtifactSchema = z.object({
  id: idSchema,
  manuscriptId: idSchema.nullable(),
  projectId: idSchema.nullable(),
  format: z.enum(EXPORT_FORMATS),
  requestedByUserId: idSchema,
  createdAt: z.string().datetime(),
});
export type ExportArtifact = z.infer<typeof exportArtifactSchema>;
