import type { AdapterCapability, Region } from '@basira/shared';

/**
 * Model-backend adapter interfaces (§8). Every adapter returns its modelName +
 * modelVersion so the service can stamp provenance — no artefact without it.
 */

export interface TranscribeResult {
  text: string;
  perRegionText?: Record<string, string>;
  /** 0..1, page-level; per-line where available. */
  confidence?: number;
  lines?: Array<{ text: string; confidence?: number }>;
  modelName: string;
  modelVersion: string;
}

export interface TranscribeAdapter {
  key: string;
  capability: Extract<AdapterCapability, 'transcribe'>;
  capabilities: { scripts: string[]; handlesHandwriting: boolean };
  transcribe(input: {
    imageBuffer: Buffer;
    mediaType?: string;
    regions?: Region[];
    sourceLanguageHint?: string;
  }): Promise<TranscribeResult>;
}

export interface TranslateResult {
  text: string;
  alignment?: Array<{ source: string; target: string }>;
  glosses?: Array<{ term: string; gloss: string }>;
  modelName: string;
  modelVersion: string;
}

export interface TranslateAdapter {
  key: string;
  capability: Extract<AdapterCapability, 'translate'>;
  translate(input: {
    sourceText: string;
    sourceLang: string;
    targetLang: string;
    domainHint?: 'islamic-manuscript';
    wantGlosses?: boolean;
    glossary?: Array<{ term: string; gloss: string }>;
  }): Promise<TranslateResult>;
}

export interface NerResult {
  entities: Array<{
    type: string;
    surfaceText: string;
    normalizedName?: string;
    span?: [number, number];
  }>;
  modelName: string;
  modelVersion: string;
}

export interface NerAdapter {
  key: string;
  capability: Extract<AdapterCapability, 'ner'>;
  extract(input: { text: string; lang: string }): Promise<NerResult>;
}

export type Adapter = TranscribeAdapter | TranslateAdapter | NerAdapter;
