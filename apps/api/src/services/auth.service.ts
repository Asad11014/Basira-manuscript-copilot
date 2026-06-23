import type { RegisterRequest, LoginRequest, User } from '@basira/shared';
import { prisma } from '../lib/db.js';
import { conflict } from '../http/errors.js';
import { hashPassword } from '../auth/password.js';
import { signToken } from '../auth/jwt.js';
import { resolveAuthProvider } from '../auth/provider.js';
import { toUserDto } from '../serializers/user.serializer.js';
import { recordAudit } from './audit.service.js';

// Ensure the default provider self-registers.
import '../auth/password-provider.js';

export interface AuthResult {
  user: User;
  token: string;
}

/**
 * Register a new organization and its first user (an admin). Email/password
 * provisioning is intentionally specific to the default provider; SSO would
 * provision via its own flow. (§14)
 */
export async function register(input: RegisterRequest): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('An account with this email already exists');

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: input.orgName } });
    return tx.user.create({
      data: {
        orgId: org.id,
        email,
        passwordHash,
        name: input.name,
        role: 'admin', // first user of an org administers it
      },
    });
  });

  await recordAudit({
    orgId: user.orgId,
    userId: user.id,
    action: 'auth.register',
    targetType: 'user',
    targetId: user.id,
  });

  return { user: toUserDto(user), token: signToken(user.id) };
}

export async function login(
  input: LoginRequest,
  providerKey?: string,
): Promise<AuthResult> {
  const provider = resolveAuthProvider(providerKey);
  const { userId } = await provider.authenticate({
    email: input.email.toLowerCase(),
    password: input.password,
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  await recordAudit({
    orgId: user.orgId,
    userId: user.id,
    action: 'auth.login',
    targetType: 'user',
    targetId: user.id,
  });

  return { user: toUserDto(user), token: signToken(user.id) };
}
