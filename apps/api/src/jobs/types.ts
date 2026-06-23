import type { JobType } from '@basira/shared';
import type { Logger } from '../lib/logger.js';

/** Payload carried on the BullMQ job (mirrors the DB Job row). */
export interface JobPayload {
  jobId: string;
  type: JobType;
  entityRef: string;
  orgId: string;
  adapterKey?: string;
  data: Record<string, unknown>;
}

export interface JobContext {
  jobId: string;
  entityRef: string;
  orgId: string;
  adapterKey?: string;
  data: Record<string, unknown>;
  log: Logger;
  /** Update progress 0..100 on both the DB Job row and the BullMQ job. */
  setProgress(progress: number): Promise<void>;
}

export interface JobResult {
  /** Reference to the produced artefact (e.g. transcription id, file key). */
  resultRef?: string;
}

/**
 * One handler per job type (§9). Handlers resolve adapters from the registry,
 * run, and write versioned results + provenance.
 */
export interface JobHandler {
  type: JobType;
  run(ctx: JobContext): Promise<JobResult | void>;
}
