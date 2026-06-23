import { z } from 'zod';
import { config } from '../../lib/config.js';
import { callLlmJson } from '../llm/anthropic-client.js';
import { registerAdapter } from '../registry.js';
import type { TranslateAdapter } from '../types.js';
import {
  TRANSLATE_SYSTEM,
  TRANSLATE_PROMPT_VERSION,
  buildTranslateUserText,
} from './prompts/translate.v1.js';

const envelopeSchema = z.object({
  text: z.string(),
  alignment: z
    .array(z.object({ source: z.string(), target: z.string() }))
    .optional(),
  glosses: z
    .array(z.object({ term: z.string(), gloss: z.string() }))
    .optional(),
});

/**
 * DEFAULT translation adapter: domain-adapted LLM prompt with source↔target
 * alignment, optional glosses, and per-project glossary injection. (§8)
 */
export const llmTranslateAdapter: TranslateAdapter = {
  key: 'llm',
  capability: 'translate',

  async translate(input) {
    const { data, model } = await callLlmJson(
      {
        model: config.MODEL_TEXT_NAME,
        system: TRANSLATE_SYSTEM,
        content: [{ type: 'text', text: buildTranslateUserText(input) }],
      },
      envelopeSchema,
    );

    return {
      text: data.text,
      alignment: data.alignment,
      glosses: data.glosses,
      modelName: model,
      modelVersion: `${model} / ${TRANSLATE_PROMPT_VERSION}`,
    };
  },
};

registerAdapter(llmTranslateAdapter);
