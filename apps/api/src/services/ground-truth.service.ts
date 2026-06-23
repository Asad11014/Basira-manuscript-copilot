import JSZip from 'jszip';
import sharp from 'sharp';
import type { Bbox } from '@basira/shared';
import { prisma } from '../lib/db.js';
import { notFound } from '../http/errors.js';
import { getStorage } from '../storage/index.js';
import { restrictedTranscribeAdapters } from './transcribe-access.js';
import type { AuthUser } from '../auth/context.js';

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export interface GroundTruthExport {
  zip: Buffer;
  filename: string;
  lines: number;
  unsegmentedPages: number;
  excludedPages: number;
}

/**
 * Build a Kraken-trainable ZIP of line image ↔ text pairs from a manuscript's
 * CURRENT transcriptions — owned training data for the production model (FR/§20
 * flywheel). Pages whose transcription came from a licence-restricted model
 * (e.g. the non-commercial Muharaf model) are EXCLUDED, so restricted outputs
 * can never contaminate the commercial training set.
 */
export async function buildGroundTruthZip(
  user: AuthUser,
  manuscriptId: string,
): Promise<GroundTruthExport> {
  const manuscript = await prisma.manuscript.findFirst({
    where: { id: manuscriptId, project: { orgId: user.orgId } },
  });
  if (!manuscript) throw notFound('Manuscript not found');

  const restricted = restrictedTranscribeAdapters();
  const pages = await prisma.page.findMany({
    where: { manuscriptId },
    orderBy: { index: 'asc' },
    include: {
      regions: { where: { type: 'line' }, orderBy: { order: 'asc' } },
      transcriptions: { where: { isCurrent: true } },
    },
  });

  const storage = getStorage();
  const zip = new JSZip();
  let lines = 0;
  let unsegmentedPages = 0;
  let excludedPages = 0;

  for (const page of pages) {
    const t = page.transcriptions[0];
    if (!t) continue;

    // Licence guard — never include restricted-model outputs in training data.
    const adapterKey = (t.provenance as { adapterKey?: string } | null)
      ?.adapterKey;
    if (adapterKey && restricted.includes(adapterKey)) {
      excludedPages++;
      continue;
    }

    const textLines = t.text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const { body } = await storage.get(
      page.processedImageKey ?? page.originalImageKey,
    );
    const meta = await sharp(body).metadata();
    const w = meta.width ?? page.width ?? 0;
    const h = meta.height ?? page.height ?? 0;
    const idx = String(page.index + 1).padStart(3, '0');

    if (w && h && page.regions.length > 0 && page.regions.length === textLines.length) {
      // Clean alignment: crop each line region, pair with the matching text line.
      for (let i = 0; i < page.regions.length; i++) {
        const b = page.regions[i]!.bbox as Bbox;
        const left = clamp(Math.round(b.x * w), 0, w - 1);
        const top = clamp(Math.round(b.y * h), 0, h - 1);
        const width = clamp(Math.round(b.w * w), 1, w - left);
        const height = clamp(Math.round(b.h * h), 1, h - top);
        const lineImg = await sharp(body)
          .extract({ left, top, width, height })
          .png()
          .toBuffer();
        const name = `lines/${idx}_${String(i + 1).padStart(2, '0')}`;
        zip.file(`${name}.png`, lineImg);
        zip.file(`${name}.gt.txt`, textLines[i]!);
        lines++;
      }
    } else {
      // Couldn't line-align — include the whole page for manual segmentation
      // (e.g. import into eScriptorium) so nothing is lost.
      zip.file(`pages/${idx}.png`, await sharp(body).png().toBuffer());
      zip.file(`pages/${idx}.gt.txt`, t.text);
      unsegmentedPages++;
    }
  }

  zip.file(
    'README.txt',
    [
      `Basira ground-truth export — ${manuscript.title}`,
      `Generated ${new Date().toISOString()}`,
      '',
      'lines/   line image + .gt.txt pairs (Kraken `path` training format).',
      'pages/   pages that could not be auto-segmented — segment in eScriptorium.',
      '',
      `Aligned lines: ${lines}`,
      `Unsegmented pages: ${unsegmentedPages}`,
      `Pages excluded (restricted/non-commercial model output): ${excludedPages}`,
      '',
      'This is YOUR data (scholar-corrected). Outputs from licence-restricted',
      'models are excluded so the training set stays commercially clean.',
    ].join('\n'),
  );

  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  return {
    zip: buf,
    filename: `basira-groundtruth-${manuscript.id}.zip`,
    lines,
    unsegmentedPages,
    excludedPages,
  };
}
