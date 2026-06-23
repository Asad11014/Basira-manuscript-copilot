import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/db.js';
import { getStorage } from '../../storage/index.js';
import { storageKeys } from '../../lib/keys.js';
import { runPreprocess } from '../../preprocess/pipeline.js';
import { detectRegions } from '../../preprocess/regions.js';
import { registerJobHandler } from '../registry.js';
import type { JobHandler } from '../types.js';

/**
 * Preprocess a page: enhance the image (orient/deskew/denoise/contrast), store
 * processed + thumbnail variants, detect layout regions, and advance status.
 * Idempotent — re-running replaces the page's regions and processed artefacts.
 */
export const preprocessHandler: JobHandler = {
  type: 'preprocess',
  async run(ctx) {
    const page = await prisma.page.findUniqueOrThrow({
      where: { id: ctx.entityRef },
    });
    const storage = getStorage();

    await ctx.setProgress(10);
    const { body: original } = await storage.get(page.originalImageKey);

    await ctx.setProgress(25);
    const { processed, thumbnail, width, height } =
      await runPreprocess(original);

    const processedKey = storageKeys.pageProcessed(
      page.manuscriptId,
      page.index,
    );
    const thumbnailKey = storageKeys.pageThumbnail(
      page.manuscriptId,
      page.index,
    );
    await storage.put(processedKey, processed, 'image/png');
    await storage.put(thumbnailKey, thumbnail, 'image/png');

    await ctx.setProgress(70);
    const regions = await detectRegions(processed);

    await prisma.$transaction([
      prisma.region.deleteMany({ where: { pageId: page.id } }),
      ...regions.map((r) =>
        prisma.region.create({
          data: {
            pageId: page.id,
            type: r.type,
            bbox: r.bbox as unknown as Prisma.InputJsonValue,
            order: r.order,
          },
        }),
      ),
      prisma.page.update({
        where: { id: page.id },
        data: {
          processedImageKey: processedKey,
          thumbnailKey,
          width,
          height,
          // Only advance to 'preprocessed' from the initial upload state, so we
          // don't regress a page that's already been transcribed/translated.
          status: page.status === 'uploaded' ? 'preprocessed' : page.status,
        },
      }),
    ]);

    await ctx.setProgress(100);
    ctx.log.info({ pageId: page.id, regions: regions.length }, 'Page preprocessed');
    return { resultRef: page.id };
  },
};

registerJobHandler(preprocessHandler);
