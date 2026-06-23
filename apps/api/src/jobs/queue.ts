import { Queue } from 'bullmq';
import { createRedisConnection } from '../lib/redis.js';
import type { JobPayload } from './types.js';

export const JOB_QUEUE_NAME = 'basira-jobs';

let queue: Queue<JobPayload> | undefined;

export function getQueue(): Queue<JobPayload> {
  return (queue ??= new Queue<JobPayload>(JOB_QUEUE_NAME, {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  }));
}
