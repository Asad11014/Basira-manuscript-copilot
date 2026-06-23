import type { Translation as PrismaTranslation } from '@prisma/client';
import type { Provenance, Translation } from '@basira/shared';

type Align = Array<{ source: string; target: string }>;
type Glosses = Array<{ term: string; gloss: string }>;

export function toTranslationDto(t: PrismaTranslation): Translation {
  return {
    id: t.id,
    transcriptionId: t.transcriptionId,
    version: t.version,
    targetLang: t.targetLang,
    text: t.text,
    alignment: (t.alignment as Align | null) ?? null,
    glosses: (t.glosses as Glosses | null) ?? null,
    provenance: t.provenance as unknown as Provenance,
    createdByUserId: t.createdByUserId,
    isCurrent: t.isCurrent,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
