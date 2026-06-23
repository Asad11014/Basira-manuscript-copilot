import sharp from 'sharp';
import { registerPreprocessStep, type PreprocessStep } from '../types.js';

/** Median filter removes speckle/scan noise while preserving stroke edges. */
export const denoiseStep: PreprocessStep = {
  key: 'denoise',
  run: (input) => sharp(input).median(3).toBuffer(),
};

registerPreprocessStep(denoiseStep);
