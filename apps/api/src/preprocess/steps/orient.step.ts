import sharp from 'sharp';
import { registerPreprocessStep, type PreprocessStep } from '../types.js';

/** Auto-orient from EXIF metadata so rotated camera scans display upright. */
export const orientStep: PreprocessStep = {
  key: 'orient',
  run: (input) => sharp(input).rotate().toBuffer(),
};

registerPreprocessStep(orientStep);
