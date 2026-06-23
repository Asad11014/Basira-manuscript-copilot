import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { apiRouter } from './routes/index.js';
import { errorMiddleware, notFoundHandler } from './http/error-middleware.js';

/**
 * Builds the Express app. Bootstrap (listen) lives in index.ts — keeping the app
 * factory pure makes it importable from tests without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(
    cors({
      origin: config.WEB_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());

  app.use('/', apiRouter);

  app.use(notFoundHandler);
  app.use(errorMiddleware);

  return app;
}
