import path from 'node:path';
import { createRequire } from 'node:module';
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// pdf.js needs the standard-font data to rasterise PDFs that reference (rather
// than embed) the base-14 fonts; without it, such pages render blank.
const require = createRequire(import.meta.url);
const STANDARD_FONT_DATA_URL = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'standard_fonts/',
);

/** Canvas factory pdf.js uses to allocate render targets in Node. */
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
    return { canvas, context: canvas.getContext('2d') };
  }
  reset(
    target: { canvas: ReturnType<typeof createCanvas>; context: SKRSContext2D },
    width: number,
    height: number,
  ) {
    target.canvas.width = Math.ceil(width);
    target.canvas.height = Math.ceil(height);
  }
  destroy(target: { canvas: ReturnType<typeof createCanvas> }) {
    target.canvas.width = 0;
    target.canvas.height = 0;
  }
}

/**
 * Rasterise each PDF page to a PNG buffer. `scale` trades quality for size;
 * 2.0 (~150–200 DPI) is a good default for recognition.
 */
export async function rasterizePdf(
  data: Buffer,
  scale = 2,
): Promise<Buffer[]> {
  const canvasFactory = new NodeCanvasFactory();
  // `canvasFactory` is accepted at runtime but isn't in the public param type;
  // cast through the inferred parameter type to pass it without `any`.
  const src = {
    data: new Uint8Array(data),
    canvasFactory,
    isEvalSupported: false,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    verbosity: 0, // errors only — silence per-glyph font warnings
  } as Parameters<typeof pdfjs.getDocument>[0];
  const doc = await pdfjs.getDocument(src).promise;

  const pages: Buffer[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const { canvas, context } = canvasFactory.create(
        viewport.width,
        viewport.height,
      );
      // The canvas starts transparent; paint white so scans look like paper and
      // downstream analysis doesn't read transparent pixels as ink.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({
        // pdf.js types expect a browser CanvasRenderingContext2D; the napi
        // context is API-compatible for the operations it performs.
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;
      pages.push(canvas.toBuffer('image/png'));
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return pages;
}
