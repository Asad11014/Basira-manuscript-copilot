import type { Prisma, Transcription as PrismaTranscription } from '@prisma/client';
import type {
  Provenance,
  Transcription,
  UpdateTranscriptionRequest,
} from '@basira/shared';
import { prisma } from '../lib/db.js';
import { notFound } from '../http/errors.js';
import { humanProvenance } from '../provenance/stamp.js';
import { toTranscriptionDto } from '../serializers/transcription.serializer.js';
import { findPageForOrg } from './page.service.js';
import { recordAudit } from './audit.service.js';
import type { AuthUser } from '../auth/context.js';

export interface SaveTranscriptionInput {
  pageId: string;
  text: string;
  perRegionText?: Record<string, string> | null;
  confidence?: number | null;
  provenance: Provenance;
  createdByUserId?: string | null;
}

/**
 * Append a new transcription version (§7 versioning rule): flip the previous
 * current row, compute the next version, insert. Advances page status to
 * `transcribed` from the initial states. Used by the job handler and edits.
 */
export async function saveTranscriptionVersion(
  input: SaveTranscriptionInput,
): Promise<PrismaTranscription> {
  return prisma.$transaction(async (tx) => {
    const last = await tx.transcription.findFirst({
      where: { pageId: input.pageId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    await tx.transcription.updateMany({
      where: { pageId: input.pageId, isCurrent: true },
      data: { isCurrent: false },
    });
    const created = await tx.transcription.create({
      data: {
        pageId: input.pageId,
        version: (last?.version ?? 0) + 1,
        text: input.text,
        perRegionText: (input.perRegionText ??
          undefined) as Prisma.InputJsonValue,
        confidence: input.confidence ?? undefined,
        provenance: input.provenance as unknown as Prisma.InputJsonValue,
        createdByUserId: input.createdByUserId ?? undefined,
        isCurrent: true,
      },
    });
    const page = await tx.page.findUniqueOrThrow({
      where: { id: input.pageId },
      select: { status: true },
    });
    if (page.status === 'uploaded' || page.status === 'preprocessed') {
      await tx.page.update({
        where: { id: input.pageId },
        data: { status: 'transcribed' },
      });
    }
    return created;
  });
}

export async function listTranscriptions(
  user: AuthUser,
  pageId: string,
): Promise<Transcription[]> {
  await findPageForOrg(user.orgId, pageId);
  const rows = await prisma.transcription.findMany({
    where: { pageId },
    orderBy: { version: 'desc' },
  });
  return rows.map(toTranscriptionDto);
}

/** Human edit → new version with human provenance. (FR-7, FR-13) */
export async function updateTranscription(
  user: AuthUser,
  id: string,
  input: UpdateTranscriptionRequest,
): Promise<Transcription> {
  const existing = await prisma.transcription.findFirst({
    where: { id, page: { manuscript: { project: { orgId: user.orgId } } } },
    select: { pageId: true },
  });
  if (!existing) throw notFound('Transcription not found');

  const created = await saveTranscriptionVersion({
    pageId: existing.pageId,
    text: input.text,
    perRegionText: input.perRegionText ?? null,
    provenance: humanProvenance('transcribe', user.id),
    createdByUserId: user.id,
  });

  await recordAudit({
    orgId: user.orgId,
    userId: user.id,
    action: 'transcription.edit',
    targetType: 'transcription',
    targetId: created.id,
    metadata: { pageId: existing.pageId, version: created.version },
  });

  return toTranscriptionDto(created);
}
