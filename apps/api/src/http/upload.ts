import multer from 'multer';
import type { RequestHandler } from 'express';
import { config } from '../lib/config.js';

/**
 * In-memory upload (we forward bytes straight to object storage). Size is capped
 * by MAX_UPLOAD_MB; the error middleware maps Multer's limit error to 413.
 */
export const uploadSingle: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 },
}).single('file');
