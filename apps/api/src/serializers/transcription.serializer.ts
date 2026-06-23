import type { Transcription as PrismaTranscription } from '@prisma/client';
import type { Provenance, Transcription } from '@basira/shared';

export function toTranscriptionDto(t: PrismaTranscription): Transcription {
  return {
    id: t.id,
    pageId: t.pageId,
    version: t.version,
    text: t.text,
    perRegionText: (t.perRegionText as Record<string, string> | null) ?? null,
    confidence: t.confidence,
    provenance: t.provenance as unknown as Provenance,
    createdByUserId: t.createdByUserId,
    isCurrent: t.isCurrent,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
