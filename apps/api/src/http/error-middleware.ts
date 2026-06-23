import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { AppError } from './errors.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json({ error: { code: 'not_found', message: 'Route not found' } });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-arg shape.
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
        issues: err.issues,
      },
    });
    return;
  }

  if (err instanceof MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'payload_too_large' : 'bad_request',
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, issues: err.issues },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: { code: 'conflict', message: 'A unique constraint was violated' },
      });
      return;
    }
    if (err.code === 'P2025') {
      res
        .status(404)
        .json({ error: { code: 'not_found', message: 'Record not found' } });
      return;
    }
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'internal_error', message: 'Internal server error' },
  });
};
