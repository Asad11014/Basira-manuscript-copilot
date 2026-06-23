import { Router } from 'express';
import {
  batchRequestSchema,
  createManuscriptRequestSchema,
  type Job,
  type ManuscriptDetail,
  type Page,
} from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { badRequest } from '../http/errors.js';
import { param, parseBody } from '../http/validate.js';
import { uploadSingle } from '../http/upload.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import {
  createManuscript,
  findManuscriptForOrg,
  getManuscript,
} from '../services/manuscript.service.js';
import { buildGroundTruthZip } from '../services/ground-truth.service.js';
import { enqueueJob } from '../jobs/enqueue.js';
import { toJobDto } from '../serializers/job.serializer.js';

export const manuscriptRoutes: Router = Router();

manuscriptRoutes.use(requireAuth);

manuscriptRoutes.post(
  '/',
  requireRole('admin', 'editor'),
  uploadSingle,
  asyncHandler<ManuscriptDetail>(async (req, res) => {
    if (!req.file) throw badRequest('A manuscript file is required (field: file)');

    // Multipart fields arrive as strings; metadata is sent as a JSON string.
    const raw: Record<string, unknown> = { ...req.body };
    if (typeof raw.metadata === 'string' && raw.metadata.length > 0) {
      try {
        raw.metadata = JSON.parse(raw.metadata);
      } catch {
        throw badRequest('metadata must be valid JSON');
      }
    }

    const input = createManuscriptRequestSchema.parse(raw);
    const manuscript = await createManuscript(getAuthUser(req), input, {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    });
    res.status(201).json(manuscript);
  }),
);

manuscriptRoutes.get(
  '/:id',
  asyncHandler<ManuscriptDetail>(async (req, res) => {
    res.json(await getManuscript(getAuthUser(req), param(req, 'id')));
  }),
);

manuscriptRoutes.get(
  '/:id/pages',
  asyncHandler<Page[]>(async (req, res) => {
    const { pages } = await getManuscript(getAuthUser(req), param(req, 'id'));
    res.json(pages);
  }),
);

// Export Kraken-trainable ground truth (owned-data flywheel; excludes
// restricted-model outputs). Editor/admin only. (§20)
manuscriptRoutes.get(
  '/:id/ground-truth',
  requireRole('admin', 'editor'),
  asyncHandler(async (req, res) => {
    const result = await buildGroundTruthZip(getAuthUser(req), param(req, 'id'));
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.zip);
  }),
);

// Batch-process every page of the manuscript through the requested steps. (§9, FR-20)
manuscriptRoutes.post(
  '/:id/batch',
  requireRole('admin', 'editor'),
  asyncHandler<Job>(async (req, res) => {
    const user = getAuthUser(req);
    const id = param(req, 'id');
    const input = parseBody(batchRequestSchema, req);
    await findManuscriptForOrg(user.orgId, id);

    const job = await enqueueJob({
      type: 'batch',
      entityRef: id,
      orgId: user.orgId,
      data: { steps: input.steps, targetLang: input.targetLang },
    });
    res.status(202).json(toJobDto(job));
  }),
);
