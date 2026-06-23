import { z } from 'zod';
import { ENTITY_TYPES } from '@basira/shared';
import { config } from '../../lib/config.js';
import { callLlmJson } from '../llm/anthropic-client.js';
import { registerAdapter } from '../registry.js';
import type { NerAdapter } from '../types.js';
import {
  NER_SYSTEM,
  NER_PROMPT_VERSION,
  buildNerUserText,
} from './prompts/ner.v1.js';

const envelopeSchema = z.object({
  entities: z.array(
    z.object({
      type: z.enum(ENTITY_TYPES),
      surfaceText: z.string().min(1),
      normalizedName: z.string().optional(),
    }),
  ),
});

/** DEFAULT NER adapter: extracts people/works/places/citations via the LLM. (§8) */
export const llmNerAdapter: NerAdapter = {
  key: 'llm',
  capability: 'ner',

  async extract({ text, lang }) {
    const { data, model } = await callLlmJson(
      {
        model: config.MODEL_TEXT_NAME,
        system: NER_SYSTEM,
        content: [{ type: 'text', text: buildNerUserText(lang, text) }],
      },
      envelopeSchema,
    );

    return {
      entities: data.entities.map((e) => ({
        type: e.type,
        surfaceText: e.surfaceText,
        normalizedName: e.normalizedName,
      })),
      modelName: model,
      modelVersion: `${model} / ${NER_PROMPT_VERSION}`,
    };
  },
};

registerAdapter(llmNerAdapter);
