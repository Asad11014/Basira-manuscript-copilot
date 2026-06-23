import { Router } from 'express';
import {
  updateTranscriptionRequestSchema,
  type Transcription,
  type Translation,
} from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { param, parseBody } from '../http/validate.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import { updateTranscription } from '../services/transcription.service.js';
import { listTranslations } from '../services/translation.service.js';

export const transcriptionRoutes: Router = Router();

transcriptionRoutes.use(requireAuth);

// Editing creates a new version (human authority). (§10)
transcriptionRoutes.put(
  '/:id',
  requireRole('admin', 'editor'),
  asyncHandler<Transcription>(async (req, res) => {
    const input = parseBody(updateTranscriptionRequestSchema, req);
    res.json(
      await updateTranscription(getAuthUser(req), param(req, 'id'), input),
    );
  }),
);

transcriptionRoutes.get(
  '/:id/translations',
  asyncHandler<Translation[]>(async (req, res) => {
    res.json(await listTranslations(getAuthUser(req), param(req, 'id')));
  }),
);
