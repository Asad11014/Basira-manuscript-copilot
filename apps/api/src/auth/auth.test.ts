import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './jwt.js';
import { hashPassword, verifyPassword } from './password.js';
import { AppError } from '../http/errors.js';

describe('jwt', () => {
  it('round-trips a user id through sign/verify', () => {
    const token = signToken('user-123');
    expect(verifyToken(token).sub).toBe('user-123');
  });

  it('rejects a tampered token with a 401 AppError', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow(AppError);
  });
});

describe('password hashing', () => {
  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash).not.toContain('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });
});
