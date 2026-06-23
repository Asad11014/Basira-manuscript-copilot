import type { AdapterCapability, Provenance } from '@basira/shared';

/**
 * Build a provenance record for a generated artefact (§0.4, §8). Every saved
 * transcription/translation/entity passes through here — no artefact without it.
 */
export function buildProvenance(input: {
  capability: AdapterCapability;
  adapterKey: string;
  modelName: string;
  modelVersion: string;
  details?: Record<string, unknown>;
}): Provenance {
  return {
    capability: input.capability,
    adapterKey: input.adapterKey,
    modelName: input.modelName,
    modelVersion: input.modelVersion,
    generatedAt: new Date().toISOString(),
    details: input.details,
  };
}

/** Provenance for a human edit (a version authored by a person, not a model). */
export function humanProvenance(
  capability: AdapterCapability,
  userId: string,
): Provenance {
  return {
    capability,
    adapterKey: 'human',
    modelName: 'human',
    modelVersion: 'manual',
    generatedAt: new Date().toISOString(),
    details: { editedByUserId: userId },
  };
}
