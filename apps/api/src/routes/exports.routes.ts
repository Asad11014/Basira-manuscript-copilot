import { Router } from 'express';
import { createExportRequestSchema, type Job } from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { param, parseBody } from '../http/validate.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import { createExport, downloadExport } from '../services/export.service.js';

export const exportRoutes: Router = Router();

exportRoutes.use(requireAuth);

exportRoutes.post(
  '/',
  requireRole('admin', 'editor'),
  asyncHandler<Job>(async (req, res) => {
    const input = parseBody(createExportRequestSchema, req);
    res.status(202).json(await createExport(getAuthUser(req), input));
  }),
);

exportRoutes.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const dl = await downloadExport(getAuthUser(req), param(req, 'id'));
    res.set('Content-Type', dl.object.contentType);
    res.set('Content-Disposition', `attachment; filename="${dl.filename}"`);
    res.send(dl.object.body);
  }),
);
