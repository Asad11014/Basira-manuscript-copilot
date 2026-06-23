import { z } from 'zod';
import { config } from '../../lib/config.js';
import { AppError } from '../../http/errors.js';
import { registerAdapter } from '../registry.js';
import type { TranscribeAdapter } from '../types.js';

/**
 * Dedicated HTR adapter backed by a Kraken sidecar service (free, open-source).
 * The heavy Python/Kraken/model stack lives in a container; this adapter just
 * POSTs the page image and parses the result. Set TRANSCRIBE_ADAPTER=kraken.
 *
 * Run the sidecar with: `docker compose --profile kraken up -d kraken`.
 */
const responseSchema = z.object({
  text: z.string(),
  lines: z
    .array(
      z.object({
        text: z.string(),
        confidence: z.number().min(0).max(1).nullable().optional(),
      }),
    )
    .optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  model_name: z.string(),
  model_version: z.string(),
});

export const krakenAdapter: TranscribeAdapter = {
  key: 'kraken',
  capability: 'transcribe',
  capabilities: {
    scripts: ['arabic', 'persian', 'ottoman'],
    handlesHandwriting: true,
  },

  async transcribe({ imageBuffer, mediaType = 'image/png' }) {
    const form = new FormData();
    // Copy into a fresh Uint8Array so the Blob is backed by a plain ArrayBuffer.
    const bytes = new Uint8Array(imageBuffer);
    form.append('image', new Blob([bytes], { type: mediaType }), 'page.png');

    let res: Response;
    try {
      res = await fetch(`${config.KRAKEN_URL}/transcribe`, {
        method: 'POST',
        body: form,
      });
    } catch (err) {
      throw new AppError(
        503,
        'kraken_unavailable',
        `Cannot reach the Kraken service at ${config.KRAKEN_URL} — is the sidecar running? (${String(err)})`,
      );
    }

    const body = await res.text();
    if (!res.ok) {
      throw new AppError(
        502,
        'kraken_error',
        `Kraken returned ${res.status}: ${body.slice(0, 500)}`,
      );
    }

    const data = responseSchema.parse(JSON.parse(body));
    const lines = data.lines?.map((l) => ({
      text: l.text,
      confidence: l.confidence ?? undefined,
    }));

    return {
      text: data.text,
      lines,
      confidence: data.confidence ?? undefined,
      modelName: data.model_name,
      modelVersion: data.model_version,
    };
  },
};

registerAdapter(krakenAdapter);
