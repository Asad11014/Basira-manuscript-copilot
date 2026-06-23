import { Router } from 'express';
import { z } from 'zod';
import {
  IMAGE_VARIANTS,
  transcribeRequestSchema,
  translateRequestSchema,
  type Annotation,
  type Entity,
  type Job,
  type PageDetail,
  type Transcription,
} from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { param, parseBody, parseQuery } from '../http/validate.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import {
  findPageForOrg,
  getPageDetail,
  getPageImage,
} from '../services/page.service.js';
import { listTranscriptions } from '../services/transcription.service.js';
import { listAnnotations } from '../services/annotation.service.js';
import { listEntities } from '../services/entity.service.js';
import { enqueueJob } from '../jobs/enqueue.js';
import { toJobDto } from '../serializers/job.serializer.js';

export const pageRoutes: Router = Router();

pageRoutes.use(requireAuth);

const imageQuerySchema = z.object({
  variant: z.enum(IMAGE_VARIANTS).default('original'),
});

pageRoutes.get(
  '/:id',
  asyncHandler<PageDetail>(async (req, res) => {
    res.json(await getPageDetail(getAuthUser(req), param(req, 'id')));
  }),
);

pageRoutes.get(
  '/:id/image',
  asyncHandler(async (req, res) => {
    const { variant } = parseQuery(imageQuerySchema, req);
    const obj = await getPageImage(getAuthUser(req), param(req, 'id'), variant);
    res.set('Content-Type', obj.contentType);
    res.set('Cache-Control', 'private, max-age=300');
    res.send(obj.body);
  }),
);

pageRoutes.get(
  '/:id/transcriptions',
  asyncHandler<Transcription[]>(async (req, res) => {
    res.json(await listTranscriptions(getAuthUser(req), param(req, 'id')));
  }),
);

// Pipeline action — enqueues a transcription job. (§10)
pageRoutes.post(
  '/:id/transcribe',
  requireRole('admin', 'editor'),
  asyncHandler<Job>(async (req, res) => {
    const user = getAuthUser(req);
    const pageId = param(req, 'id');
    const input = parseBody(transcribeRequestSchema, req);
    await findPageForOrg(user.orgId, pageId); // authorize before enqueue

    const job = await enqueueJob({
      type: 'transcribe',
      entityRef: pageId,
      orgId: user.orgId,
      adapterKey: input.adapterKey,
      data: { sourceLanguageHint: input.sourceLanguageHint },
    });
    res.status(202).json(toJobDto(job));
  }),
);

pageRoutes.post(
  '/:id/translate',
  requireRole('admin', 'editor'),
  asyncHandler<Job>(async (req, res) => {
    const user = getAuthUser(req);
    const pageId = param(req, 'id');
    const input = parseBody(translateRequestSchema, req);
    await findPageForOrg(user.orgId, pageId);

    const job = await enqueueJob({
      type: 'translate',
      entityRef: pageId,
      orgId: user.orgId,
      adapterKey: input.adapterKey,
      data: {
        targetLang: input.targetLang,
        wantGlosses: input.wantGlosses ?? false,
      },
    });
    res.status(202).json(toJobDto(job));
  }),
);

pageRoutes.get(
  '/:id/annotations',
  asyncHandler<Annotation[]>(async (req, res) => {
    res.json(await listAnnotations(getAuthUser(req), param(req, 'id')));
  }),
);

pageRoutes.get(
  '/:id/entities',
  asyncHandler<Entity[]>(async (req, res) => {
    res.json(await listEntities(getAuthUser(req), param(req, 'id')));
  }),
);

// Pipeline action — enqueue named-entity detection on the current transcription.
pageRoutes.post(
  '/:id/ner',
  requireRole('admin', 'editor'),
  asyncHandler<Job>(async (req, res) => {
    const user = getAuthUser(req);
    const pageId = param(req, 'id');
    await findPageForOrg(user.orgId, pageId);
    const job = await enqueueJob({
      type: 'ner',
      entityRef: pageId,
      orgId: user.orgId,
    });
    res.status(202).json(toJobDto(job));
  }),
);
