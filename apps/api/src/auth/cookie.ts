import type { Response } from 'express';
import { config, isProd } from '../lib/config.js';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Store the JWT in an httpOnly cookie — not readable by JS. (§14) */
export function setAuthCookie(res: Response, token: string): void {
  // SameSite=None requires Secure; also force Secure in production.
  const secure =
    config.COOKIE_SECURE || isProd || config.COOKIE_SAMESITE === 'none';
  res.cookie(config.COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: config.COOKIE_SAMESITE,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(config.COOKIE_NAME, { path: '/' });
}
