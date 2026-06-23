import sharp from 'sharp';
import { registerPreprocessStep, type PreprocessStep } from '../types.js';
import { grayscaleRaw } from '../raw.js';

const ANGLE_RANGE = 6; // degrees, +/-
const DOWNSCALE_WIDTH = 500;

/** Variance of the per-row dark-pixel counts. Peaks when text lines are level. */
function projectionScore(data: Buffer, width: number, height: number): number {
  const rowCounts = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    let count = 0;
    const base = y * width;
    for (let x = 0; x < width; x++) {
      if ((data[base + x] ?? 255) < 128) count++;
    }
    rowCounts[y] = count;
  }
  const mean = rowCounts.reduce((a, b) => a + b, 0) / height;
  return rowCounts.reduce((acc, c) => acc + (c - mean) ** 2, 0) / height;
}

/** Estimate skew by rotating a downscaled copy and maximising projection score. */
async function estimateSkew(input: Buffer): Promise<number> {
  const small = await sharp(input)
    .greyscale()
    .resize({ width: DOWNSCALE_WIDTH, withoutEnlargement: true })
    .png()
    .toBuffer();

  let bestAngle = 0;
  let bestScore = -1;
  for (let angle = -ANGLE_RANGE; angle <= ANGLE_RANGE; angle++) {
    const rotated = await sharp(small)
      .rotate(angle, { background: '#ffffff' })
      .png()
      .toBuffer();
    const { data, width, height } = await grayscaleRaw(rotated);
    const score = projectionScore(data, width, height);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }
  return bestAngle;
}

/**
 * Deskew the page. A real Hough/projection refinement can replace this later as
 * a drop-in step; the integer-degree search is fast and robust for MVP scans.
 */
export const deskewStep: PreprocessStep = {
  key: 'deskew',
  async run(input) {
    const angle = await estimateSkew(input);
    if (Math.abs(angle) < 1) return input;
    return sharp(input).rotate(angle, { background: '#ffffff' }).toBuffer();
  },
};

registerPreprocessStep(deskewStep);
