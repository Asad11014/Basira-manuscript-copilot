import { prisma } from '../../lib/db.js';
import { getStorage } from '../../storage/index.js';
import { resolveTranscribeAdapter } from '../../adapters/registry.js';
import { buildProvenance } from '../../provenance/stamp.js';
import { saveTranscriptionVersion } from '../../services/transcription.service.js';
import { recordAudit } from '../../services/audit.service.js';
import { registerJobHandler } from '../registry.js';
import type { JobHandler } from '../types.js';

/**
 * Resolve the configured transcription adapter, run it on the page image, and
 * save the result as a new versioned Transcription with provenance. (§4 lifecycle)
 */
export const transcribeHandler: JobHandler = {
  type: 'transcribe',
  async run(ctx) {
    const page = await prisma.page.findUniqueOrThrow({
      where: { id: ctx.entityRef },
    });
    const adapter = resolveTranscribeAdapter(ctx.adapterKey || undefined);
    const sourceLanguageHint =
      typeof ctx.data.sourceLanguageHint === 'string'
        ? ctx.data.sourceLanguageHint
        : undefined;

    await ctx.setProgress(15);
    const { body, contentType } = await getStorage().get(
      page.processedImageKey ?? page.originalImageKey,
    );

    await ctx.setProgress(30);
    const result = await adapter.transcribe({
      imageBuffer: body,
      mediaType: contentType,
      sourceLanguageHint,
    });

    await ctx.setProgress(85);
    const created = await saveTranscriptionVersion({
      pageId: page.id,
      text: result.text,
      confidence: result.confidence ?? null,
      provenance: buildProvenance({
        capability: 'transcribe',
        adapterKey: adapter.key,
        modelName: result.modelName,
        modelVersion: result.modelVersion,
        details: { lineCount: result.lines?.length ?? null },
      }),
    });

    await recordAudit({
      orgId: ctx.orgId,
      action: 'transcription.generate',
      targetType: 'transcription',
      targetId: created.id,
      metadata: { pageId: page.id, adapter: adapter.key },
    });

    await ctx.setProgress(100);
    ctx.log.info(
      { pageId: page.id, transcriptionId: created.id, adapter: adapter.key },
      'Transcription generated',
    );
    return { resultRef: created.id };
  },
};

registerJobHandler(transcribeHandler);
