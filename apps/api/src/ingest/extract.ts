import sharp from 'sharp';
import { badRequest } from '../http/errors.js';
import { rasterizePdf } from './pdf.js';
import { extractZipImages } from './zip.js';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

type Kind = 'pdf' | 'zip' | 'image';

function detectKind(file: UploadedFile): Kind {
  const name = file.originalname.toLowerCase();
  const mime = file.mimetype.toLowerCase();
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime === 'application/zip' ||
    mime === 'application/x-zip-compressed' ||
    name.endsWith('.zip')
  )
    return 'zip';
  if (mime.startsWith('image/') || /\.(png|jpe?g|tiff?|webp)$/.test(name))
    return 'image';
  throw badRequest(`Unsupported file type: ${file.mimetype || file.originalname}`);
}

/**
 * Split an uploaded file into normalised PNG page images. PDFs are rasterised,
 * ZIPs are unpacked (natural order), single images become one page. (FR-1/FR-2)
 */
export async function extractPages(file: UploadedFile): Promise<Buffer[]> {
  const kind = detectKind(file);

  if (kind === 'pdf') {
    const rendered = await rasterizePdf(file.buffer);
    if (rendered.length === 0) throw badRequest('PDF contained no pages');
    return rendered;
  }

  if (kind === 'zip') {
    const images = await extractZipImages(file.buffer);
    if (images.length === 0) throw badRequest('ZIP contained no images');
    return Promise.all(images.map((i) => sharp(i.buffer).png().toBuffer()));
  }

  return [await sharp(file.buffer).png().toBuffer()];
}
