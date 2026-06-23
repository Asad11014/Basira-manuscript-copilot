import { Router } from 'express';
import {
  createAnnotationRequestSchema,
  updateAnnotationRequestSchema,
  type Annotation,
} from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { param, parseBody } from '../http/validate.js';
import { requireAuth } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import {
  createAnnotation,
  updateAnnotation,
} from '../services/annotation.service.js';

export const annotationRoutes: Router = Router();

annotationRoutes.use(requireAuth);

// Any authenticated user may annotate (viewers can comment, §2).
annotationRoutes.post(
  '/',
  asyncHandler<Annotation>(async (req, res) => {
    const input = parseBody(createAnnotationRequestSchema, req);
    res.status(201).json(await createAnnotation(getAuthUser(req), input));
  }),
);

annotationRoutes.patch(
  '/:id',
  asyncHandler<Annotation>(async (req, res) => {
    const input = parseBody(updateAnnotationRequestSchema, req);
    res.json(await updateAnnotation(getAuthUser(req), param(req, 'id'), input));
  }),
);
