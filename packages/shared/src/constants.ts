/**
 * Shared enums and constants — the single source of truth for the string unions
 * used across the data model, API boundaries, and UI. (§7)
 *
 * Declared as `const` tuples so we can derive both Zod enums and TS types from
 * one place without drift.
 */

export const ROLES = ['admin', 'editor', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const PAGE_STATUSES = [
  'uploaded',
  'preprocessed',
  'transcribed',
  'translated',
] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

export const REGION_TYPES = ['textblock', 'line', 'margin'] as const;
export type RegionType = (typeof REGION_TYPES)[number];

export const JOB_TYPES = [
  'preprocess',
  'transcribe',
  'translate',
  'ner',
  'export',
  'batch',
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = ['queued', 'running', 'done', 'failed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const ANNOTATION_KINDS = [
  'comment',
  'gloss',
  'citationFlag',
  'uncertainFlag',
] as const;
export type AnnotationKind = (typeof ANNOTATION_KINDS)[number];

export const ENTITY_TYPES = ['person', 'work', 'place', 'citation'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const EXPORT_FORMATS = ['docx', 'pdf', 'txt', 'json', 'csv'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const SEARCH_SCOPES = [
  'transcription',
  'translation',
  'annotation',
] as const;
export type SearchScope = (typeof SEARCH_SCOPES)[number];

/** Capabilities the adapter registry resolves by key. (§8) */
export const ADAPTER_CAPABILITIES = ['transcribe', 'translate', 'ner'] as const;
export type AdapterCapability = (typeof ADAPTER_CAPABILITIES)[number];

/**
 * MVP prioritises Arabic-script languages first. (§3)
 * Codes are BCP-47-ish; `ota` = Ottoman Turkish.
 */
export const SUPPORTED_SOURCE_LANGS = ['ar', 'fa', 'ota'] as const;
export type SupportedSourceLang = (typeof SUPPORTED_SOURCE_LANGS)[number];

/** Sentinel emitted by transcription adapters for illegible runs. (§8) */
export const ILLEGIBLE_TOKEN = '[illegible]';

/** Image variants persisted per page. */
export const IMAGE_VARIANTS = ['original', 'processed', 'thumbnail'] as const;
export type ImageVariant = (typeof IMAGE_VARIANTS)[number];

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
