import { Router } from 'express';
import type { Job } from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { param } from '../http/validate.js';
import { requireAuth } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import { getJob } from '../services/job.service.js';

export const jobRoutes: Router = Router();

jobRoutes.use(requireAuth);

jobRoutes.get(
  '/:id',
  asyncHandler<Job>(async (req, res) => {
    res.json(await getJob(getAuthUser(req), param(req, 'id')));
  }),
);

const POLL_MS = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * SSE stream of job status (§9 SSE upgrade seam). Polls the job row and pushes
 * updates until it reaches a terminal state or the client disconnects.
 */
jobRoutes.get(
  '/:id/stream',
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const id = param(req, 'id');
    await getJob(user, id); // authorize before opening the stream

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    while (!closed) {
      const job = await getJob(user, id);
      res.write(`data: ${JSON.stringify(job)}\n\n`);
      if (job.status === 'done' || job.status === 'failed') break;
      await sleep(POLL_MS);
    }
    res.end();
  }),
);
