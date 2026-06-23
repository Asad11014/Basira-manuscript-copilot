import type { Request } from 'express';
import type { Role } from '@basira/shared';
import { unauthorized } from '../http/errors.js';

/** The authenticated principal attached to a request by `requireAuth`. */
export interface AuthUser {
  id: string;
  orgId: string;
  role: Role;
  email: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

/**
 * Type-narrowing accessor for handlers that run behind `requireAuth`. Throws if
 * called on an unauthenticated request (a programming error in that case).
 */
export function getAuthUser(req: Request): AuthUser {
  if (!req.authUser) throw unauthorized();
  return req.authUser;
}
