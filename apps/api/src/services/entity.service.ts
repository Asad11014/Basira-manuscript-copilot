import type { Prisma } from '@prisma/client';
import type { Entity, EntityType, Provenance } from '@basira/shared';
import { prisma } from '../lib/db.js';
import { toEntityDto } from '../serializers/entity.serializer.js';
import { findPageForOrg } from './page.service.js';
import type { AuthUser } from '../auth/context.js';

export interface EntityInput {
  type: EntityType;
  surfaceText: string;
  normalizedName?: string;
  span?: [number, number] | null;
}

/**
 * Replace the entities for a transcription (idempotent re-run) with a freshly
 * extracted set, all stamped with the same provenance.
 */
export async function saveEntitiesForTranscription(params: {
  pageId: string;
  transcriptionId: string;
  entities: EntityInput[];
  provenance: Provenance;
}): Promise<number> {
  await prisma.$transaction([
    prisma.entity.deleteMany({
      where: { transcriptionId: params.transcriptionId },
    }),
    prisma.entity.createMany({
      data: params.entities.map((e) => ({
        pageId: params.pageId,
        transcriptionId: params.transcriptionId,
        type: e.type,
        surfaceText: e.surfaceText,
        normalizedName: e.normalizedName,
        span: (e.span ?? undefined) as Prisma.InputJsonValue,
        provenance: params.provenance as unknown as Prisma.InputJsonValue,
      })),
    }),
  ]);
  return params.entities.length;
}

/** Entities for a page's CURRENT transcription, org-scoped. */
export async function listEntities(
  user: AuthUser,
  pageId: string,
): Promise<Entity[]> {
  await findPageForOrg(user.orgId, pageId);
  const current = await prisma.transcription.findFirst({
    where: { pageId, isCurrent: true },
    select: { id: true },
  });
  const rows = await prisma.entity.findMany({
    where: current ? { transcriptionId: current.id } : { pageId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toEntityDto);
}
