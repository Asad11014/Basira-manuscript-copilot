import { prisma } from '../lib/db.js';
import { unauthorized } from '../http/errors.js';
import { verifyPassword } from './password.js';
import { registerAuthProvider, type AuthProvider } from './provider.js';

/** Default email/password provider, backed by the User table. */
export const passwordProvider: AuthProvider = {
  key: 'password',
  async authenticate({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    // Constant-ish failure path: same error whether the user exists or not.
    if (!user || user.disabled) throw unauthorized('Invalid credentials');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid credentials');
    return { userId: user.id };
  },
};

registerAuthProvider(passwordProvider);
