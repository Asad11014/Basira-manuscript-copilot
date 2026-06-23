import type { Entity as PrismaEntity } from '@prisma/client';
import type { Entity, EntityType, Provenance } from '@basira/shared';

export function toEntityDto(e: PrismaEntity): Entity {
  return {
    id: e.id,
    pageId: e.pageId,
    transcriptionId: e.transcriptionId,
    type: e.type as EntityType,
    surfaceText: e.surfaceText,
    normalizedName: e.normalizedName,
    span: (e.span as [number, number] | null) ?? null,
    provenance: e.provenance as unknown as Provenance,
    createdAt: e.createdAt.toISOString(),
  };
}
