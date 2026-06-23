import { z } from 'zod';
import { config } from '../../lib/config.js';
import { callLlmJson } from '../llm/anthropic-client.js';
import { registerAdapter } from '../registry.js';
import type { TranscribeAdapter } from '../types.js';
import {
  TRANSCRIBE_SYSTEM,
  TRANSCRIBE_PROMPT_VERSION,
  buildTranscribeUserText,
} from './prompts/transcribe.v1.js';

const envelopeSchema = z.object({
  text: z.string(),
  lines: z
    .array(
      z.object({
        text: z.string(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    )
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
});

/**
 * DEFAULT transcription adapter: sends the (preprocessed) page image to a
 * vision-capable LLM and parses a strict JSON envelope. (§8)
 */
export const llmVisionAdapter: TranscribeAdapter = {
  key: 'llm-vision',
  capability: 'transcribe',
  capabilities: {
    scripts: ['arabic', 'persian', 'ottoman'],
    handlesHandwriting: true,
  },

  async transcribe({ imageBuffer, mediaType = 'image/png', sourceLanguageHint }) {
    const { data, model } = await callLlmJson(
      {
        model: config.MODEL_VISION_NAME,
        system: TRANSCRIBE_SYSTEM,
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/webp',
              data: imageBuffer.toString('base64'),
            },
          },
          { type: 'text', text: buildTranscribeUserText(sourceLanguageHint) },
        ],
      },
      envelopeSchema,
    );

    return {
      text: data.text,
      lines: data.lines,
      confidence: data.confidence,
      modelName: model,
      modelVersion: `${model} / ${TRANSCRIBE_PROMPT_VERSION}`,
    };
  },
};

registerAdapter(llmVisionAdapter);
