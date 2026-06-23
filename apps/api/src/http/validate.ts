import type { Request } from 'express';
import type { z } from 'zod';
import { badRequest } from './errors.js';

/** Read a required route param. Throws 400 if absent (satisfies strict indexing). */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (value === undefined) throw badRequest(`Missing route parameter: ${name}`);
  return value;
}

/**
 * Parse-and-throw helpers. Every API boundary is validated with Zod (§5); on
 * failure the ZodError propagates to the error middleware as a 400.
 */
export const parseBody = <T extends z.ZodTypeAny>(
  schema: T,
  req: Request,
): z.infer<T> => schema.parse(req.body);

export const parseQuery = <T extends z.ZodTypeAny>(
  schema: T,
  req: Request,
): z.infer<T> => schema.parse(req.query);

export const parseParams = <T extends z.ZodTypeAny>(
  schema: T,
  req: Request,
): z.infer<T> => schema.parse(req.params);
