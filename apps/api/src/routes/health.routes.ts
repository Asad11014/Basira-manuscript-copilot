import { Router } from 'express';
import { asyncHandler } from '../http/async-handler.js';
import { prisma } from '../lib/db.js';
import { getRedis } from '../lib/redis.js';

export const healthRoutes: Router = Router();

/** Liveness — does not touch dependencies. */
healthRoutes.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'basira-api' });
});

/** Readiness — checks DB + Redis connectivity. */
healthRoutes.get(
  '/readyz',
  asyncHandler(async (_req, res) => {
    const checks: Record<string, 'ok' | 'down'> = {};
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'down';
    }
    try {
      const pong = await getRedis().ping();
      checks.redis = pong === 'PONG' ? 'ok' : 'down';
    } catch {
      checks.redis = 'down';
    }
    const ready = Object.values(checks).every((v) => v === 'ok');
    res.status(ready ? 200 : 503).json({ ready, checks });
  }),
);
