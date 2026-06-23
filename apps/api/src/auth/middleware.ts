import type { RequestHandler } from 'express';
import type { Role } from '@basira/shared';
import { prisma } from '../lib/db.js';
import { config } from '../lib/config.js';
import { forbidden, unauthorized } from '../http/errors.js';
import { asyncHandler } from '../http/async-handler.js';
import { verifyToken } from './jwt.js';

/**
 * Authenticates the request from the httpOnly cookie. Loads the user fresh from
 * the DB each request so role/disabled changes take effect immediately. Org
 * scoping is then enforced by services using `req.authUser.orgId`. (§14)
 */
export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[config.COOKIE_NAME] as string | undefined;
  if (!token) throw unauthorized();

  const { sub } = verifyToken(token);
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user || user.disabled) throw unauthorized('Session is no longer valid');

  req.authUser = {
    id: user.id,
    orgId: user.orgId,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  next();
});

/** Gate a route to one of the given roles. Use after `requireAuth`. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = req.authUser;
    if (!user) return next(unauthorized());
    if (!roles.includes(user.role)) {
      return next(forbidden('Your role does not permit this action'));
    }
    next();
  };
}
