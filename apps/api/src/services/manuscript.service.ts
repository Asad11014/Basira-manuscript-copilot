import type {
  CreateManuscriptRequest,
  Manuscript,
  ManuscriptDetail,
} from '@basira/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db.js';
import { forbidden, notFound } from '../http/errors.js';
import { storageKeys } from '../lib/keys.js';
import { getStorage } from '../storage/index.js';
import { extractPages, type UploadedFile } from '../ingest/extract.js';
import { enqueueJob } from '../jobs/enqueue.js';
import { toManuscriptDto } from '../serializers/manuscript.serializer.js';
import { toPageDto } from '../serializers/page.serializer.js';
import { recordAudit } from './audit.service.js';
import type { AuthUser } from '../auth/context.js';

/** Load a manuscript scoped to the caller's org, or throw 404. */
export async function findManuscriptForOrg(orgId: string, id: string) {
  const m = await prisma.manuscript.findFirst({
    where: { id, project: { orgId } },
  });
  if (!m) throw notFound('Manuscript not found');
  return m;
}

/**
 * Create a manuscript from an uploaded file: persist the source for provenance,
 * split into page images, create Page rows, and enqueue preprocessing per page
 * so the workspace fills in automatically. (§11 zero-friction)
 */
export async function createManuscript(
  user: AuthUser,
  input: CreateManuscriptRequest,
  file: UploadedFile,
): Promise<ManuscriptDetail> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, orgId: user.orgId },
  });
  if (!project) throw forbidden('Project not found in your organization');

  const storage = getStorage();

  const manuscript = await prisma.manuscript.create({
    data: {
      projectId: project.id,
      title: input.title,
      sourceLanguage: input.sourceLanguage,
      script: input.script,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  // Preserve the original upload (FR-2: original remains downloadable).
  const sourceKey = storageKeys.manuscriptSource(
    manuscript.id,
    file.originalname,
  );
  await storage.put(sourceKey, file.buffer, file.mimetype || 'application/octet-stream');
  await prisma.manuscript.update({
    where: { id: manuscript.id },
    data: { originalFileKey: sourceKey },
  });

  const pageImages = await extractPages(file);

  for (let index = 0; index < pageImages.length; index++) {
    const png = pageImages[index]!;
    const originalKey = storageKeys.pageOriginal(manuscript.id, index);
    await storage.put(originalKey, png, 'image/png');
    const page = await prisma.page.create({
      data: {
        manuscriptId: manuscript.id,
        index,
        originalImageKey: originalKey,
        status: 'uploaded',
      },
    });
    await enqueueJob({
      type: 'preprocess',
      entityRef: page.id,
      orgId: user.orgId,
    });
  }

  await recordAudit({
    orgId: user.orgId,
    userId: user.id,
    action: 'manuscript.create',
    targetType: 'manuscript',
    targetId: manuscript.id,
    metadata: { title: manuscript.title, pages: pageImages.length },
  });

  return getManuscript(user, manuscript.id);
}

export async function listManuscripts(
  user: AuthUser,
  projectId: string,
): Promise<Manuscript[]> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId: user.orgId },
  });
  if (!project) throw notFound('Project not found');

  const rows = await prisma.manuscript.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { pages: true } } },
  });
  return rows.map((m) => toManuscriptDto(m, m._count.pages));
}

export async function getManuscript(
  user: AuthUser,
  id: string,
): Promise<ManuscriptDetail> {
  const manuscript = await findManuscriptForOrg(user.orgId, id);
  const pages = await prisma.page.findMany({
    where: { manuscriptId: id },
    orderBy: { index: 'asc' },
  });
  return {
    ...toManuscriptDto(manuscript, pages.length),
    pages: pages.map((p) => toPageDto(p)),
  };
}
