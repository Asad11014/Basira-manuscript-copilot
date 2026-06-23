import { registerAdapter } from '../registry.js';
import { NotImplementedError } from '../../http/errors.js';
import type { TranscribeAdapter } from '../types.js';

/**
 * Seam for a dedicated HTR engine (Transkribus). Out of MVP scope — exposed as a
 * registry entry so it can be enabled by adding the implementation in one file
 * and setting TRANSCRIBE_ADAPTER=transkribus. Stub, don't fake. (§0.7, §20)
 */
export const transkribusAdapter: TranscribeAdapter = {
  key: 'transkribus',
  capability: 'transcribe',
  capabilities: { scripts: ['arabic', 'latin'], handlesHandwriting: true },
  transcribe() {
    throw new NotImplementedError('Transkribus transcription adapter');
  },
};

registerAdapter(transkribusAdapter);
