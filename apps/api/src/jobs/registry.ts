import type { JobType } from '@basira/shared';
import type { JobHandler } from './types.js';

/**
 * Job handler registry. Adding a job type = add one handler file + one
 * `registerJobHandler` call — no switch statements scattered around. (§0.2)
 */
const handlers = new Map<JobType, JobHandler>();

export function registerJobHandler(handler: JobHandler): void {
  handlers.set(handler.type, handler);
}

export function resolveJobHandler(type: JobType): JobHandler {
  const handler = handlers.get(type);
  if (!handler) throw new Error(`No job handler registered for type: ${type}`);
  return handler;
}
