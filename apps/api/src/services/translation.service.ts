import type { Prisma, Translation as PrismaTranslation } from '@prisma/client';
import type {
  Provenance,
  Translation,
  UpdateTranslationRequest,
} from '@basira/shared';
import { prisma } from '../lib/db.js';
import { notFound } from '../http/errors.js';
import { humanProvenance } from '../provenance/stamp.js';
import { toTranslationDto } from '../serializers/translation.serializer.js';
import { recordAudit } from './audit.service.js';
import type { AuthUser } from '../auth/context.js';

export interface SaveTranslationInput {
  transcriptionId: string;
  targetLang: string;
  text: string;
  alignment?: Array<{ source: string; target: string }> | null;
  glosses?: Array<{ term: string; gloss: string }> | null;
  provenance: Provenance;
  createdByUserId?: string | null;
}

/**
 * Append a translation version for a (transcription, targetLang) pair, flipping
 * the prior current row. Advances the page status to `translated`.
 */
export async function saveTranslationVersion(
  input: SaveTranslationInput,
): Promise<PrismaTranslation> {
  return prisma.$transaction(async (tx) => {
    const last = await tx.translation.findFirst({
      where: {
        transcriptionId: input.transcriptionId,
        targetLang: input.targetLang,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    await tx.translation.updateMany({
      where: {
        transcriptionId: input.transcriptionId,
        targetLang: input.targetLang,
        isCurrent: true,
      },
      data: { isCurrent: false },
    });
    const created = await tx.translation.create({
      data: {
        transcriptionId: input.transcriptionId,
        targetLang: input.targetLang,
        version: (last?.version ?? 0) + 1,
        text: input.text,
        alignment: (input.alignment ?? undefined) as Prisma.InputJsonValue,
        glosses: (input.glosses ?? undefined) as Prisma.InputJsonValue,
        provenance: input.provenance as unknown as Prisma.InputJsonValue,
        createdByUserId: input.createdByUserId ?? undefined,
        isCurrent: true,
      },
    });
    const transcription = await tx.transcription.findUniqueOrThrow({
      where: { id: input.transcriptionId },
      select: { pageId: true },
    });
    await tx.page.update({
      where: { id: transcription.pageId },
      data: { status: 'translated' },
    });
    return created;
  });
}

export async function listTranslations(
  user: AuthUser,
  transcriptionId: string,
): Promise<Translation[]> {
  const exists = await prisma.transcription.findFirst({
    where: {
      id: transcriptionId,
      page: { manuscript: { project: { orgId: user.orgId } } },
    },
    select: { id: true },
  });
  if (!exists) throw notFound('Transcription not found');

  const rows = await prisma.translation.findMany({
    where: { transcriptionId },
    orderBy: [{ targetLang: 'asc' }, { version: 'desc' }],
  });
  return rows.map(toTranslationDto);
}

export async function updateTranslation(
  user: AuthUser,
  id: string,
  input: UpdateTranslationRequest,
): Promise<Translation> {
  const existing = await prisma.translation.findFirst({
    where: {
      id,
      transcription: {
        page: { manuscript: { project: { orgId: user.orgId } } },
      },
    },
    select: { transcriptionId: true, targetLang: true },
  });
  if (!existing) throw notFound('Translation not found');

  const created = await saveTranslationVersion({
    transcriptionId: existing.transcriptionId,
    targetLang: existing.targetLang,
    text: input.text,
    alignment: input.alignment ?? null,
    provenance: humanProvenance('translate', user.id),
    createdByUserId: user.id,
  });

  await recordAudit({
    orgId: user.orgId,
    userId: user.id,
    action: 'translation.edit',
    targetType: 'translation',
    targetId: created.id,
  });

  return toTranslationDto(created);
}
