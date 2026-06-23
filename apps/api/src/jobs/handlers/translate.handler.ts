import { prisma } from '../../lib/db.js';
import { config } from '../../lib/config.js';
import { badRequest } from '../../http/errors.js';
import { resolveTranslateAdapter } from '../../adapters/registry.js';
import { buildProvenance } from '../../provenance/stamp.js';
import { saveTranslationVersion } from '../../services/translation.service.js';
import { recordAudit } from '../../services/audit.service.js';
import { registerJobHandler } from '../registry.js';
import type { JobHandler } from '../types.js';

type Gloss = { term: string; gloss: string };

function parseGlossary(value: unknown): Gloss[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((e) =>
    e && typeof e === 'object' && 'term' in e && 'gloss' in e
      ? [{ term: String(e.term), gloss: String(e.gloss) }]
      : [],
  );
}

/**
 * Translate a page's CURRENT transcription into the requested target language,
 * injecting the per-project glossary so corrected terminology improves future
 * runs (§8). Saves a versioned Translation with provenance.
 */
export const translateHandler: JobHandler = {
  type: 'translate',
  async run(ctx) {
    const targetLang =
      typeof ctx.data.targetLang === 'string'
        ? ctx.data.targetLang
        : config.DEFAULT_TARGET_LANG;
    const wantGlosses = ctx.data.wantGlosses === true;

    const page = await prisma.page.findUniqueOrThrow({
      where: { id: ctx.entityRef },
      include: { manuscript: { include: { project: true } } },
    });
    const transcription = await prisma.transcription.findFirst({
      where: { pageId: page.id, isCurrent: true },
    });
    if (!transcription) {
      throw badRequest('Page has no current transcription to translate');
    }

    const adapter = resolveTranslateAdapter(ctx.adapterKey || undefined);
    await ctx.setProgress(20);

    const result = await adapter.translate({
      sourceText: transcription.text,
      sourceLang: page.manuscript.sourceLanguage,
      targetLang,
      domainHint: 'islamic-manuscript',
      wantGlosses,
      glossary: parseGlossary(page.manuscript.project.glossary),
    });

    await ctx.setProgress(85);
    const created = await saveTranslationVersion({
      transcriptionId: transcription.id,
      targetLang,
      text: result.text,
      alignment: result.alignment ?? null,
      glosses: result.glosses ?? null,
      provenance: buildProvenance({
        capability: 'translate',
        adapterKey: adapter.key,
        modelName: result.modelName,
        modelVersion: result.modelVersion,
        details: { targetLang, alignmentPairs: result.alignment?.length ?? 0 },
      }),
    });

    await recordAudit({
      orgId: ctx.orgId,
      action: 'translation.generate',
      targetType: 'translation',
      targetId: created.id,
      metadata: { pageId: page.id, targetLang, adapter: adapter.key },
    });

    await ctx.setProgress(100);
    return { resultRef: created.id };
  },
};

registerJobHandler(translateHandler);
