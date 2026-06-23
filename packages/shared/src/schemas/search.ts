import { z } from 'zod';
import { SEARCH_SCOPES } from '../constants.js';
import { idSchema } from './common.js';

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  projectId: idSchema.optional(),
  scope: z.enum(SEARCH_SCOPES).optional(),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

/** A single hit, with enough context to navigate to the page. (FR-16) */
export const searchHitSchema = z.object({
  scope: z.enum(SEARCH_SCOPES),
  pageId: idSchema,
  pageIndex: z.number().int(),
  manuscriptId: idSchema,
  manuscriptTitle: z.string(),
  snippet: z.string(),
});
export type SearchHit = z.infer<typeof searchHitSchema>;

export const searchResultsSchema = z.object({
  query: z.string(),
  hits: z.array(searchHitSchema),
});
export type SearchResults = z.infer<typeof searchResultsSchema>;
