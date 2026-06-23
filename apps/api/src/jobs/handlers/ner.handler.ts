import type { EntityType } from '@basira/shared';
import { prisma } from '../../lib/db.js';
import { badRequest } from '../../http/errors.js';
import { resolveNerAdapter } from '../../adapters/registry.js';
import { buildProvenance } from '../../provenance/stamp.js';
import { saveEntitiesForTranscription } from '../../services/entity.service.js';
import { recordAudit } from '../../services/audit.service.js';
import { registerJobHandler } from '../registry.js';
import type { JobHandler } from '../types.js';

/** Locate the surface text in the transcription to derive a char span. */
function findSpan(text: string, surface: string): [number, number] | null {
  const idx = text.indexOf(surface);
  return idx === -1 ? null : [idx, idx + surface.length];
}

/**
 * Extract named entities from a page's CURRENT transcription and persist them
 * with provenance and (where locatable) character spans. (FR-10)
 */
export const nerHandler: JobHandler = {
  type: 'ner',
  async run(ctx) {
    const page = await prisma.page.findUniqueOrThrow({
      where: { id: ctx.entityRef },
      include: { manuscript: true },
    });
    const transcription = await prisma.transcription.findFirst({
      where: { pageId: page.id, isCurrent: true },
    });
    if (!transcription) {
      throw badRequest('Page has no current transcription for entity detection');
    }

    const adapter = resolveNerAdapter(ctx.adapterKey || undefined);
    await ctx.setProgress(25);

    const result = await adapter.extract({
      text: transcription.text,
      lang: page.manuscript.sourceLanguage,
    });

    await ctx.setProgress(80);
    const count = await saveEntitiesForTranscription({
      pageId: page.id,
      transcriptionId: transcription.id,
      entities: result.entities.map((e) => ({
        type: e.type as EntityType, // validated by the adapter's Zod enum
        surfaceText: e.surfaceText,
        normalizedName: e.normalizedName,
        span: findSpan(transcription.text, e.surfaceText),
      })),
      provenance: buildProvenance({
        capability: 'ner',
        adapterKey: adapter.key,
        modelName: result.modelName,
        modelVersion: result.modelVersion,
        details: { entityCount: result.entities.length },
      }),
    });

    await recordAudit({
      orgId: ctx.orgId,
      action: 'ner.generate',
      targetType: 'page',
      targetId: page.id,
      metadata: { entities: count, adapter: adapter.key },
    });

    await ctx.setProgress(100);
    return { resultRef: page.id };
  },
};

registerJobHandler(nerHandler);
