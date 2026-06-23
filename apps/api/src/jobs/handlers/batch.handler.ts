import type { JobType } from '@basira/shared';
import { prisma } from '../../lib/db.js';
import { registerJobHandler, resolveJobHandler } from '../registry.js';
import type { JobContext, JobHandler } from '../types.js';

/**
 * Batch-process a manuscript: run the requested steps over every page (§9).
 * Steps run in order per page (so transcribe precedes translate) by reusing the
 * individual step handlers; the parent job reports aggregate progress.
 */
export const batchHandler: JobHandler = {
  type: 'batch',
  async run(ctx) {
    const steps = (
      Array.isArray(ctx.data.steps) ? ctx.data.steps : []
    ) as JobType[];
    const targetLang =
      typeof ctx.data.targetLang === 'string' ? ctx.data.targetLang : undefined;

    const pages = await prisma.page.findMany({
      where: { manuscriptId: ctx.entityRef },
      orderBy: { index: 'asc' },
      select: { id: true },
    });

    const total = Math.max(1, pages.length * steps.length);
    let done = 0;

    for (const page of pages) {
      for (const step of steps) {
        const handler = resolveJobHandler(step);
        const childCtx: JobContext = {
          jobId: ctx.jobId,
          entityRef: page.id,
          orgId: ctx.orgId,
          data: step === 'translate' ? { targetLang } : {},
          log: ctx.log.child({ batchStep: step, pageId: page.id }),
          setProgress: async () => undefined,
        };
        await handler.run(childCtx);
        done++;
        await ctx.setProgress(Math.round((done / total) * 100));
      }
    }

    ctx.log.info(
      { manuscriptId: ctx.entityRef, pages: pages.length, steps },
      'Batch complete',
    );
    return { resultRef: ctx.entityRef };
  },
};

registerJobHandler(batchHandler);
