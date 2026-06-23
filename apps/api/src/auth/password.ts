import bcrypt from 'bcryptjs';

const ROUNDS = 10;

/** Never log the plaintext or the hash. (§14) */
export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, ROUNDS);

export const verifyPassword = (
  plain: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(plain, hash);
