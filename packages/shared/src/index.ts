/**
 * @basira/shared — the type-safe contract between client and server.
 *
 * Zod schemas are the source of truth; TS types are inferred from them.
 * No `any` crosses an API boundary. (§0.6)
 */

export * from './constants.js';

export * from './schemas/common.js';
export * from './schemas/organization.js';
export * from './schemas/user.js';
export * from './schemas/auth.js';
export * from './schemas/project.js';
export * from './schemas/manuscript.js';
export * from './schemas/region.js';
export * from './schemas/page.js';
export * from './schemas/transcription.js';
export * from './schemas/translation.js';
export * from './schemas/annotation.js';
export * from './schemas/entity.js';
export * from './schemas/search.js';
export * from './schemas/export.js';
export * from './schemas/admin.js';
export * from './schemas/job.js';
