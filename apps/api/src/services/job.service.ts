import type { Job } from '@basira/shared';
import { prisma } from '../lib/db.js';
import { notFound } from '../http/errors.js';
import { toJobDto } from '../serializers/job.serializer.js';
import type { AuthUser } from '../auth/context.js';

/** Fetch a job, scoped to the caller's org (jobs carry a denormalised orgId). */
export async function getJob(user: AuthUser, id: string): Promise<Job> {
  const job = await prisma.job.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!job) throw notFound('Job not found');
  return toJobDto(job);
}
