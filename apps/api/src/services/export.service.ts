import type { CreateExportRequest, Job } from '@basira/shared';
import { prisma } from '../lib/db.js';
import { notFound } from '../http/errors.js';
import { getStorage, type StoredObject } from '../storage/index.js';
import { enqueueJob } from '../jobs/enqueue.js';
import { toJobDto } from '../serializers/job.serializer.js';
import type { AuthUser } from '../auth/context.js';

/** Validate ownership, then enqueue an export job. */
export async function createExport(
  user: AuthUser,
  input: CreateExportRequest,
): Promise<Job> {
  if (input.manuscriptId) {
    const m = await prisma.manuscript.findFirst({
      where: { id: input.manuscriptId, project: { orgId: user.orgId } },
      select: { id: true },
    });
    if (!m) throw notFound('Manuscript not found');
  } else {
    const p = await prisma.project.findFirst({
      where: { id: input.projectId, orgId: user.orgId },
      select: { id: true },
    });
    if (!p) throw notFound('Project not found');
  }

  const job = await enqueueJob({
    type: 'export',
    entityRef: (input.manuscriptId ?? input.projectId) as string,
    orgId: user.orgId,
    data: {
      format: input.format,
      manuscriptId: input.manuscriptId,
      projectId: input.projectId,
      requestedByUserId: user.id,
    },
  });
  return toJobDto(job);
}

export interface ExportDownload {
  object: StoredObject;
  format: string;
  filename: string;
}

/** Fetch a finished export artifact's bytes for download, org-scoped. */
export async function downloadExport(
  user: AuthUser,
  exportId: string,
): Promise<ExportDownload> {
  const artifact = await prisma.exportArtifact.findFirst({
    where: { id: exportId, orgId: user.orgId },
  });
  if (!artifact) throw notFound('Export not found');
  const object = await getStorage().get(artifact.fileKey);
  return {
    object,
    format: artifact.format,
    filename: `basira-export-${artifact.id}.${artifact.format}`,
  };
}
