import { createApp } from './app.js';
import { config, isProd } from './lib/config.js';
import { logger } from './lib/logger.js';
import { startWorker } from './jobs/worker.js';

// Bootstrap only — all wiring lives in app.ts and the modules it imports. (§6)
const app = createApp();

const server = app.listen(config.API_PORT, () => {
  logger.info(
    { port: config.API_PORT, env: config.NODE_ENV },
    'Basira API listening',
  );
});

// In dev, run the job worker in-process so `pnpm dev` is zero-friction. In
// production you can either run a separate worker (`pnpm worker`, horizontally
// scalable) or keep it in-process by setting RUN_INLINE_WORKER=true (cheaper —
// one service). Default: inline in dev, off in prod unless explicitly enabled.
const inlineWorker =
  process.env.RUN_INLINE_WORKER === 'true' ||
  (!isProd && process.env.RUN_INLINE_WORKER !== 'false');
if (inlineWorker) startWorker();

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down');
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
