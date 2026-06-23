import type { Prisma } from '@prisma/client';
import type {
  Annotation,
  CreateAnnotationRequest,
  UpdateAnnotationRequest,
} from '@basira/shared';
import { prisma } from '../lib/db.js';
import { forbidden, notFound } from '../http/errors.js';
import { toAnnotationDto } from '../serializers/annotation.serializer.js';
import { findPageForOrg } from './page.service.js';
import { recordAudit } from './audit.service.js';
import type { AuthUser } from '../auth/context.js';

const withUser = { user: { select: { name: true } } } as const;

async function assertPageInOrg(orgId: string, pageId: string) {
  await findPageForOrg(orgId, pageId);
}

async function assertTranscriptionInOrg(orgId: string, transcriptionId: string) {
  const t = await prisma.transcription.findFirst({
    where: {
      id: transcriptionId,
      page: { manuscript: { project: { orgId } } },
    },
    select: { id: true },
  });
  if (!t) throw notFound('Transcription not found');
}

/** Any authenticated user may annotate (viewers can comment, §2). */
export async function createAnnotation(
  user: AuthUser,
  input: CreateAnnotationRequest,
): Promise<Annotation> {
  if (input.pageId) await assertPageInOrg(user.orgId, input.pageId);
  if (input.transcriptionId)
    await assertTranscriptionInOrg(user.orgId, input.transcriptionId);

  const created = await prisma.annotation.create({
    data: {
      pageId: input.pageId,
      transcriptionId: input.transcriptionId,
      userId: user.id,
      kind: input.kind,
      body: input.body,
      anchor: input.anchor as Prisma.InputJsonValue,
    },
    include: withUser,
  });

  await recordAudit({
    orgId: user.orgId,
    userId: user.id,
    action: 'annotation.create',
    targetType: 'annotation',
    targetId: created.id,
    metadata: { kind: created.kind },
  });

  return toAnnotationDto(created);
}

export async function listAnnotations(
  user: AuthUser,
  pageId: string,
): Promise<Annotation[]> {
  await findPageForOrg(user.orgId, pageId);
  const rows = await prisma.annotation.findMany({
    where: { OR: [{ pageId }, { transcription: { pageId } }] },
    include: withUser,
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toAnnotationDto);
}

export async function updateAnnotation(
  user: AuthUser,
  id: string,
  input: UpdateAnnotationRequest,
): Promise<Annotation> {
  const existing = await prisma.annotation.findFirst({
    where: {
      id,
      OR: [
        { page: { manuscript: { project: { orgId: user.orgId } } } },
        {
          transcription: {
            page: { manuscript: { project: { orgId: user.orgId } } },
          },
        },
      ],
    },
  });
  if (!existing) throw notFound('Annotation not found');

  // Author can edit their own; editors/admins can resolve/manage any.
  const isPrivileged = user.role === 'admin' || user.role === 'editor';
  if (existing.userId !== user.id && !isPrivileged) {
    throw forbidden('You can only edit your own annotations');
  }

  const updated = await prisma.annotation.update({
    where: { id },
    data: {
      body: input.body,
      resolved: input.resolved,
    },
    include: withUser,
  });
  return toAnnotationDto(updated);
}
