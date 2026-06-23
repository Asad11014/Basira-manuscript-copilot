import { z } from 'zod';
import { idSchema } from './common.js';

export const projectSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  tags: z.array(z.string().min(1).max(50)),
  /** Per-project glossary injected into the translation prompt. (§8) */
  glossary: z.array(
    z.object({ term: z.string(), gloss: z.string() }),
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof projectSchema>;

export const createProjectRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
});
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;

export const updateProjectRequestSchema = createProjectRequestSchema
  .partial()
  .extend({
    glossary: z
      .array(z.object({ term: z.string().min(1), gloss: z.string().min(1) }))
      .optional(),
  });
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;
