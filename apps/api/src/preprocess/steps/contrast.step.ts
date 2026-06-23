import sharp from 'sharp';
import { registerPreprocessStep, type PreprocessStep } from '../types.js';

/**
 * Stretch contrast (normalize) and gently sharpen so faded ink reads better.
 * Kept conservative to avoid destroying detail the recogniser needs.
 */
export const contrastStep: PreprocessStep = {
  key: 'contrast',
  run: (input) => sharp(input).normalize().sharpen().toBuffer(),
};

registerPreprocessStep(contrastStep);
