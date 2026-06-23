/**
 * A single, composable image-preprocessing step (§5). Steps are registered and
 * resolved by key; the pipeline runs the configured sequence. Adding a step =
 * one file + one registry line. (§0.2)
 */
export interface PreprocessStep {
  key: string;
  run(input: Buffer): Promise<Buffer>;
}

const steps = new Map<string, PreprocessStep>();

export function registerPreprocessStep(step: PreprocessStep): void {
  steps.set(step.key, step);
}

export function resolvePreprocessStep(key: string): PreprocessStep {
  const step = steps.get(key);
  if (!step) throw new Error(`Unknown preprocess step: ${key}`);
  return step;
}

/** Default pipeline order applied to every page during preprocessing. */
export const DEFAULT_PIPELINE = ['orient', 'deskew', 'denoise', 'contrast'];
