import { Router } from 'express';
import {
  updateTranslationRequestSchema,
  type Translation,
} from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { param, parseBody } from '../http/validate.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import { updateTranslation } from '../services/translation.service.js';

export const translationRoutes: Router = Router();

translationRoutes.use(requireAuth);

translationRoutes.put(
  '/:id',
  requireRole('admin', 'editor'),
  asyncHandler<Translation>(async (req, res) => {
    const input = parseBody(updateTranslationRequestSchema, req);
    res.json(await updateTranslation(getAuthUser(req), param(req, 'id'), input));
  }),
);
