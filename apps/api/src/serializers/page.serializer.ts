import type { Page as PrismaPage, Region as PrismaRegion } from '@prisma/client';
import type { Bbox, Page, PageDetail, Region } from '@basira/shared';

export function toPageDto(
  page: PrismaPage,
  currentTranscriptionId: string | null = null,
): Page {
  return {
    id: page.id,
    manuscriptId: page.manuscriptId,
    index: page.index,
    originalImageKey: page.originalImageKey,
    processedImageKey: page.processedImageKey,
    hasThumbnail: page.thumbnailKey !== null,
    width: page.width,
    height: page.height,
    status: page.status,
    currentTranscriptionId,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export function toRegionDto(region: PrismaRegion): Region {
  return {
    id: region.id,
    pageId: region.pageId,
    type: region.type,
    bbox: region.bbox as Bbox,
    order: region.order,
  };
}

export function toPageDetailDto(
  page: PrismaPage & { regions: PrismaRegion[] },
  currentTranscriptionId: string | null = null,
): PageDetail {
  return {
    ...toPageDto(page, currentTranscriptionId),
    regions: page.regions.map(toRegionDto),
  };
}
