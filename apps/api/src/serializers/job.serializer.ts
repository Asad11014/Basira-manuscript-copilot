import type { Job as PrismaJob } from '@prisma/client';
import type { Job } from '@basira/shared';

export function toJobDto(job: PrismaJob): Job {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    entityRef: job.entityRef,
    progress: job.progress,
    error: job.error,
    adapterKey: job.adapterKey,
    resultRef: job.resultRef,
    parentJobId: job.parentJobId,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
