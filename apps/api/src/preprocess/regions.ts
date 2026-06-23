import type { RegionType } from '@basira/shared';
import { grayscaleRaw } from './raw.js';

export interface DetectedRegion {
  type: RegionType;
  bbox: { x: number; y: number; w: number; h: number };
  order: number;
}

const ANALYZE_WIDTH = 1000;
const DARK_THRESHOLD = 128;
const MIN_ROW_DARK_RATIO = 0.015; // a row is "text" if >=1.5% pixels are dark
const LINE_GAP_TOLERANCE = 3; // merge bands separated by <= N rows
const MIN_LINE_HEIGHT = 4;
const MAX_LINES = 250;

interface Band {
  top: number;
  bottom: number;
}

/**
 * Detect layout regions by horizontal projection (§4 region detection). Produces
 * one `textblock` covering the inked area plus a `line` per detected text band.
 * A dedicated layout model can replace this as a future preprocess step.
 */
export async function detectRegions(processed: Buffer): Promise<DetectedRegion[]> {
  const { data, width, height } = await grayscaleRaw(processed, {
    width: ANALYZE_WIDTH,
  });

  const minDark = Math.max(1, Math.floor(width * MIN_ROW_DARK_RATIO));
  const isTextRow: boolean[] = new Array(height).fill(false);
  for (let y = 0; y < height; y++) {
    let count = 0;
    const base = y * width;
    for (let x = 0; x < width; x++) {
      if ((data[base + x] ?? 255) < DARK_THRESHOLD) count++;
    }
    isTextRow[y] = count >= minDark;
  }

  // Group text rows into bands, tolerating small inter-line gaps.
  const bands: Band[] = [];
  let current: Band | null = null;
  let gap = 0;
  for (let y = 0; y < height; y++) {
    if (isTextRow[y]) {
      if (!current) current = { top: y, bottom: y };
      else current.bottom = y;
      gap = 0;
    } else if (current) {
      gap++;
      if (gap > LINE_GAP_TOLERANCE) {
        bands.push(current);
        current = null;
      }
    }
  }
  if (current) bands.push(current);

  const lines = bands.filter((b) => b.bottom - b.top + 1 >= MIN_LINE_HEIGHT);

  if (lines.length === 0) {
    // Blank/uniform page — expose the whole page as one block.
    return [{ type: 'textblock', bbox: { x: 0, y: 0, w: 1, h: 1 }, order: 0 }];
  }

  // Horizontal extent of inked columns, used for the enclosing textblock.
  let minX = width;
  let maxX = 0;
  for (const band of lines) {
    for (let y = band.top; y <= band.bottom; y++) {
      const base = y * width;
      for (let x = 0; x < width; x++) {
        if ((data[base + x] ?? 255) < DARK_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
  }
  if (maxX < minX) {
    minX = 0;
    maxX = width - 1;
  }

  const blockTop = lines[0]!.top;
  const blockBottom = lines[lines.length - 1]!.bottom;

  const regions: DetectedRegion[] = [
    {
      type: 'textblock',
      bbox: {
        x: minX / width,
        y: blockTop / height,
        w: (maxX - minX + 1) / width,
        h: (blockBottom - blockTop + 1) / height,
      },
      order: 0,
    },
  ];

  lines.slice(0, MAX_LINES).forEach((band, i) => {
    regions.push({
      type: 'line',
      bbox: {
        x: minX / width,
        y: band.top / height,
        w: (maxX - minX + 1) / width,
        h: (band.bottom - band.top + 1) / height,
      },
      order: i + 1,
    });
  });

  return regions;
}
