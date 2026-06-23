import { fileURLToPath } from 'node:url';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

// Bundled Amiri (OFL) gives proper Arabic shaping; Skia handles RTL/HarfBuzz.
const FONT_PATH = fileURLToPath(
  new URL('../../assets/fonts/Amiri-Regular.ttf', import.meta.url),
);
let registered = false;
function ensureFont() {
  if (!registered) {
    GlobalFonts.registerFromPath(FONT_PATH, 'Amiri');
    registered = true;
  }
}

/**
 * Render RTL Arabic lines to a PNG. pdfkit can't shape Arabic, so we rasterise
 * shaped text with the canvas and embed the image in the PDF.
 */
export function renderArabicBlock(lines: string[]): Buffer {
  ensureFont();
  const width = 1100;
  const fontSize = 40;
  const lineHeight = 64;
  const padding = 24;
  const height = Math.max(lineHeight, lines.length * lineHeight) + padding * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000000';
  ctx.font = `${fontSize}px Amiri`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';

  lines.forEach((line, i) => {
    ctx.fillText(line, width - padding, padding + (i + 1) * lineHeight - 16);
  });

  return canvas.toBuffer('image/png');
}
