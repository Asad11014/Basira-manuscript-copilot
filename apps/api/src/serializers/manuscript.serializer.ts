import type { Manuscript as PrismaManuscript } from '@prisma/client';
import type { Manuscript } from '@basira/shared';

export function toManuscriptDto(
  m: PrismaManuscript,
  pageCount: number,
): Manuscript {
  return {
    id: m.id,
    projectId: m.projectId,
    title: m.title,
    sourceLanguage: m.sourceLanguage,
    script: m.script,
    metadata: (m.metadata as Record<string, unknown>) ?? {},
    originalFileKey: m.originalFileKey,
    witnessGroupId: m.witnessGroupId,
    pageCount,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}
