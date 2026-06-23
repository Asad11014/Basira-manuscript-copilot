import type { Job as PrismaJob } from '@prisma/client';
import type { JobType } from '@basira/shared';
import { prisma } from '../lib/db.js';
import { getQueue } from './queue.js';

export interface EnqueueInput {
  type: JobType;
  entityRef: string;
  orgId: string;
  adapterKey?: string;
  data?: Record<string, unknown>;
  parentJobId?: string;
}

/**
 * Create the Job row BEFORE enqueueing so the UI can track from t=0 (§9), then
 * add it to the BullMQ queue.
 */
export async function enqueueJob(input: EnqueueInput): Promise<PrismaJob> {
  const job = await prisma.job.create({
    data: {
      type: input.type,
      entityRef: input.entityRef,
      orgId: input.orgId,
      adapterKey: input.adapterKey,
      parentJobId: input.parentJobId,
      status: 'queued',
    },
  });

  await getQueue().add(input.type, {
    jobId: job.id,
    type: input.type,
    entityRef: input.entityRef,
    orgId: input.orgId,
    adapterKey: input.adapterKey ?? undefined,
    data: input.data ?? {},
  });

  return job;
}
