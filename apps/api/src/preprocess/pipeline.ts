import sharp from 'sharp';
import { DEFAULT_PIPELINE, resolvePreprocessStep } from './types.js';
// Register the built-in steps.
import './steps/index.js';

const THUMBNAIL_WIDTH = 360;

export interface ProcessedImage {
  processed: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
}

/** Run the configured preprocess steps in order, then derive a thumbnail + dims. */
export async function runPreprocess(
  original: Buffer,
  steps: string[] = DEFAULT_PIPELINE,
): Promise<ProcessedImage> {
  let buffer = original;
  for (const key of steps) {
    buffer = await resolvePreprocessStep(key).run(buffer);
  }

  const processed = await sharp(buffer).png().toBuffer();
  const meta = await sharp(processed).metadata();
  const thumbnail = await sharp(processed)
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .png()
    .toBuffer();

  return {
    processed,
    thumbnail,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}
