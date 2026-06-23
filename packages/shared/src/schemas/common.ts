import { z } from 'zod';
import { ADAPTER_CAPABILITIES, MAX_PAGE_SIZE } from '../constants.js';

/** Branded id helper — all ids are cuid/uuid strings at the API boundary. */
export const idSchema = z.string().min(1);

export const timestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Provenance — recorded on every generated artefact. First-class, mandatory. (§0.4, §8)
 * No artefact is persisted without it.
 */
export const provenanceSchema = z.object({
  capability: z.enum(ADAPTER_CAPABILITIES),
  adapterKey: z.string().min(1),
  modelName: z.string().min(1),
  modelVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
  /** Optional free-form details (prompt version, token usage, etc.). */
  details: z.record(z.unknown()).optional(),
});
export type Provenance = z.infer<typeof provenanceSchema>;

/** Cursor pagination shared by all list endpoints. (§10) */
export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

/** Uniform API error envelope. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    /** Zod field issues, when the failure is a validation error. */
    issues: z.array(z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Axis-aligned bounding box, normalised 0..1 relative to page dimensions. */
export const bboxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});
export type Bbox = z.infer<typeof bboxSchema>;
