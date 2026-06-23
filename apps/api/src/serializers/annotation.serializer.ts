import type {
  Annotation as PrismaAnnotation,
  User as PrismaUser,
} from '@prisma/client';
import type { Annotation, AnnotationKind, Anchor } from '@basira/shared';

type WithUser = PrismaAnnotation & { user: Pick<PrismaUser, 'name'> };

export function toAnnotationDto(a: WithUser): Annotation {
  return {
    id: a.id,
    pageId: a.pageId,
    transcriptionId: a.transcriptionId,
    userId: a.userId,
    userName: a.user.name,
    kind: a.kind as AnnotationKind,
    body: a.body,
    anchor: (a.anchor as Anchor) ?? {},
    resolved: a.resolved,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
