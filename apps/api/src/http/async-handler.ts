import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so thrown errors/rejections flow to the Express
 * error middleware instead of crashing the process. Keeps routes thin (§4).
 *
 * The single generic types the *response* body (`res.json` is checked against
 * the shared DTO). Request inputs are validated with Zod at the boundary (§5),
 * so `req.body`/`req.query` are parsed rather than statically typed here.
 */
export function asyncHandler<ResBody = unknown>(
  fn: (
    req: Request,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res as Response<ResBody>, next).catch(next);
  };
}
