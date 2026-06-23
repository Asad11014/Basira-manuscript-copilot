import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../lib/config.js';
import { unauthorized } from '../http/errors.js';

const claimsSchema = z.object({
  sub: z.string().min(1),
});
export type TokenClaims = z.infer<typeof claimsSchema>;

export function signToken(userId: string): string {
  const options: jwt.SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign({ sub: userId }, config.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenClaims {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    return claimsSchema.parse(decoded);
  } catch {
    throw unauthorized('Invalid or expired session');
  }
}
