import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { config } from '../../lib/config.js';
import { AppError } from '../../http/errors.js';

let client: Anthropic | undefined;

/** Lazily construct the Anthropic client; fail clearly if the key is missing. */
export function getAnthropic(): Anthropic {
  if (!config.MODEL_PROVIDER_API_KEY) {
    throw new AppError(
      503,
      'model_provider_unconfigured',
      'MODEL_PROVIDER_API_KEY is not set — default LLM adapters are unavailable',
    );
  }
  return (client ??= new Anthropic({ apiKey: config.MODEL_PROVIDER_API_KEY }));
}

export type LlmContentBlock = Anthropic.MessageParam['content'];

export interface LlmCallInput {
  model: string;
  system: string;
  content: Anthropic.ContentBlockParam[];
  maxTokens?: number;
}

export interface LlmCallResult<T> {
  data: T;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

/** Concatenate the text blocks of a response, ignoring thinking blocks. */
function joinText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

/** Pull the first balanced JSON object/array out of a string. */
function extractJson(text: string): string {
  const start = text.search(/[[{]/);
  if (start === -1) return text;
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close && --depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start);
}

/**
 * Call the model and parse a strict JSON envelope with Zod (§8). Adaptive
 * thinking is on for accuracy on hard pages; only text blocks are parsed.
 */
export async function callLlmJson<T extends z.ZodTypeAny>(
  input: LlmCallInput,
  schema: T,
): Promise<LlmCallResult<z.infer<T>>> {
  // NOTE: `thinking: { type: 'adaptive' }` improves quality on hard pages but
  // requires a newer @anthropic-ai/sdk than is pinned here. Enable it once the
  // SDK is bumped; Opus 4.8 runs without thinking by default in the meantime.
  const message = await getAnthropic().messages.create({
    model: input.model,
    max_tokens: input.maxTokens ?? 16000,
    system: input.system,
    messages: [{ role: 'user', content: input.content }],
  });

  const raw = joinText(message);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJson(raw));
  } catch {
    throw new AppError(
      502,
      'model_invalid_output',
      'Model did not return parseable JSON',
    );
  }

  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    throw new AppError(
      502,
      'model_invalid_output',
      `Model output failed schema validation: ${result.error.message}`,
    );
  }

  return {
    data: result.data,
    model: message.model,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  };
}
