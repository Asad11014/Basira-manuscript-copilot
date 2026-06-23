import type { AdapterCapability } from '@basira/shared';
import { config } from '../lib/config.js';
import type {
  Adapter,
  NerAdapter,
  TranscribeAdapter,
  TranslateAdapter,
} from './types.js';

/**
 * The model registry (§8). Adapters self-register by (capability, key); services
 * resolve by key — config picks the active adapter per capability. Adding a
 * backend = one new file + one `registerAdapter` call. Switching the active
 * adapter requires no code change at call sites (§17.10).
 */
const adapters = new Map<string, Adapter>();

const composite = (capability: AdapterCapability, key: string) =>
  `${capability}:${key}`;

export function registerAdapter(adapter: Adapter): void {
  adapters.set(composite(adapter.capability, adapter.key), adapter);
}

function resolve<T extends Adapter>(
  capability: AdapterCapability,
  key: string,
): T {
  const adapter = adapters.get(composite(capability, key));
  if (!adapter) {
    throw new Error(
      `No "${capability}" adapter registered for key "${key}". ` +
        `Registered: ${[...adapters.keys()].join(', ') || '(none)'}`,
    );
  }
  return adapter as T;
}

export const resolveTranscribeAdapter = (
  key: string = config.TRANSCRIBE_ADAPTER,
): TranscribeAdapter => resolve<TranscribeAdapter>('transcribe', key);

export const resolveTranslateAdapter = (
  key: string = config.TRANSLATE_ADAPTER,
): TranslateAdapter => resolve<TranslateAdapter>('translate', key);

export const resolveNerAdapter = (
  key: string = config.NER_ADAPTER,
): NerAdapter => resolve<NerAdapter>('ner', key);
