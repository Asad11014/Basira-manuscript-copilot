import type { ExportArtifact as PrismaExportArtifact } from '@prisma/client';
import type { ExportArtifact, ExportFormat } from '@basira/shared';

export function toExportArtifactDto(a: PrismaExportArtifact): ExportArtifact {
  return {
    id: a.id,
    manuscriptId: a.manuscriptId,
    projectId: a.projectId,
    format: a.format as ExportFormat,
    requestedByUserId: a.requestedByUserId,
    createdAt: a.createdAt.toISOString(),
  };
}
