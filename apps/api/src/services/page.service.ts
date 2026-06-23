import type { ImageVariant, PageDetail } from '@basira/shared';
import { prisma } from '../lib/db.js';
import { notFound } from '../http/errors.js';
import { getStorage, type StoredObject } from '../storage/index.js';
import { toPageDetailDto } from '../serializers/page.serializer.js';
import type { AuthUser } from '../auth/context.js';

/** Load a page scoped to the caller's org (page -> manuscript -> project -> org). */
export async function findPageForOrg(orgId: string, id: string) {
  const page = await prisma.page.findFirst({
    where: { id, manuscript: { project: { orgId } } },
  });
  if (!page) throw notFound('Page not found');
  return page;
}

/** Current (isCurrent) transcription id for a page, if any. */
async function currentTranscriptionId(pageId: string): Promise<string | null> {
  const t = await prisma.transcription.findFirst({
    where: { pageId, isCurrent: true },
    select: { id: true },
  });
  return t?.id ?? null;
}

export async function getPageDetail(
  user: AuthUser,
  id: string,
): Promise<PageDetail> {
  await findPageForOrg(user.orgId, id);
  const page = await prisma.page.findUniqueOrThrow({
    where: { id },
    include: { regions: { orderBy: { order: 'asc' } } },
  });
  return toPageDetailDto(page, await currentTranscriptionId(id));
}

export async function getPageImage(
  user: AuthUser,
  id: string,
  variant: ImageVariant,
): Promise<StoredObject> {
  const page = await findPageForOrg(user.orgId, id);

  // Fall back to the original if a processed variant isn't ready yet.
  const key =
    variant === 'processed'
      ? (page.processedImageKey ?? page.originalImageKey)
      : variant === 'thumbnail'
        ? (page.thumbnailKey ?? page.processedImageKey ?? page.originalImageKey)
        : page.originalImageKey;

  return getStorage().get(key);
}
