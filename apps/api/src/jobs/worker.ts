import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'bullmq';
import { createRedisConnection } from '../lib/redis.js';
import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { JOB_QUEUE_NAME } from './queue.js';
import { resolveJobHandler } from './registry.js';
import type { JobContext, JobPayload } from './types.js';
// Import handlers for their self-registration side effects.
import './handlers/index.js';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

let worker: Worker<JobPayload> | undefined;

/** Start the BullMQ worker. Safe to call once; subsequent calls return it. */
export function startWorker(): Worker<JobPayload> {
  if (worker) return worker;

  worker = new Worker<JobPayload>(
    JOB_QUEUE_NAME,
    async (job) => {
      const payload = job.data;
      const handler = resolveJobHandler(payload.type);

      await prisma.job.update({
        where: { id: payload.jobId },
        data: { status: 'running', error: null },
      });

      const ctx: JobContext = {
        jobId: payload.jobId,
        entityRef: payload.entityRef,
        orgId: payload.orgId,
        adapterKey: payload.adapterKey,
        data: payload.data,
        log: logger.child({ jobId: payload.jobId, type: payload.type }),
        async setProgress(progress) {
          const value = clamp(progress);
          await prisma.job.update({
            where: { id: payload.jobId },
            data: { progress: value },
          });
          await job.updateProgress(value);
        },
      };

      const result = await handler.run(ctx);

      await prisma.job.update({
        where: { id: payload.jobId },
        data: {
          status: 'done',
          progress: 100,
          resultRef: result?.resultRef ?? null,
        },
      });
    },
    { connection: createRedisConnection(), concurrency: 3 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.data.jobId }, 'Job attempt failed');
    if (!job) return;
    const attempts = job.opts.attempts ?? 1;
    // Only mark the DB row failed once retries are exhausted.
    if (job.attemptsMade >= attempts) {
      void prisma.job
        .update({
          where: { id: job.data.jobId },
          data: { status: 'failed', error: err.message },
        })
        .catch(() => undefined);
    }
  });

  logger.info('Job worker started');
  return worker;
}

// Start automatically when run as a standalone process (`pnpm worker`).
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) startWorker();
