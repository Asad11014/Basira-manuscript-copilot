import { Redis } from 'ioredis';
import { config } from './config.js';

/**
 * Shared ioredis connection factory. BullMQ requires `maxRetriesPerRequest: null`
 * on the connections used by its Queue/Worker. Created lazily so the API can
 * boot before Redis is reachable (it will reconnect in the background).
 */
let connection: Redis | undefined;

export function getRedis(): Redis {
  if (!connection) {
    connection = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    });
  }
  return connection;
}

/** BullMQ wants a *fresh* connection per Worker; this mints one on demand. */
export function createRedisConnection(): Redis {
  return new Redis(config.REDIS_URL, { maxRetriesPerRequest: null });
}
