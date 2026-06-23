import { pino } from 'pino';
import { config, isProd } from './config.js';

/**
 * Structured logger. Never log passwords or tokens (§14) — `redact` enforces a
 * baseline of sensitive paths even if a caller forgets.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'token',
      '*.password',
      '*.passwordHash',
    ],
    censor: '[redacted]',
  },
  transport: isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } },
});

export type Logger = typeof logger;

// Touch config so an invalid env is surfaced when the logger is first imported.
void config.NODE_ENV;
