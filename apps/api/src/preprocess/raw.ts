import sharp from 'sharp';

export interface GrayRaw {
  data: Buffer;
  width: number;
  height: number;
}

/** Decode an image to single-channel grayscale raw pixels, optionally downscaled. */
export async function grayscaleRaw(
  input: Buffer,
  opts: { width?: number } = {},
): Promise<GrayRaw> {
  // Flatten any alpha onto white so transparent pixels don't read as ink.
  let img = sharp(input).flatten({ background: '#ffffff' }).greyscale();
  if (opts.width) img = img.resize({ width: opts.width, withoutEnlargement: true });
  const { data, info } = await img
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
