import unzipper from 'unzipper';

const IMAGE_EXT = /\.(png|jpe?g|tiff?|webp)$/i;

export interface ZipImage {
  name: string;
  buffer: Buffer;
}

/** Extract image entries from a ZIP, ordered naturally by filename. */
export async function extractZipImages(data: Buffer): Promise<ZipImage[]> {
  const directory = await unzipper.Open.buffer(data);
  const files = directory.files
    .filter(
      (f) =>
        f.type === 'File' &&
        IMAGE_EXT.test(f.path) &&
        !f.path.split('/').some((part) => part.startsWith('.') || part === '__MACOSX'),
    )
    .sort((a, b) =>
      a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }),
    );

  const images: ZipImage[] = [];
  for (const file of files) {
    images.push({ name: file.path, buffer: await file.buffer() });
  }
  return images;
}
