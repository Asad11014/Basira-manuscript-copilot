import { Router } from 'express';
import { searchQuerySchema, type SearchResults } from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { parseQuery } from '../http/validate.js';
import { requireAuth } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import { search } from '../services/search.service.js';

export const searchRoutes: Router = Router();

searchRoutes.use(requireAuth);

searchRoutes.get(
  '/',
  asyncHandler<SearchResults>(async (req, res) => {
    const query = parseQuery(searchQuerySchema, req);
    res.json(await search(getAuthUser(req), query));
  }),
);
