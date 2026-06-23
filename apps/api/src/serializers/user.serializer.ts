import type { User as PrismaUser } from '@prisma/client';
import type { User } from '@basira/shared';

/** Prisma User -> public API DTO. Drops passwordHash; dates to ISO strings. */
export function toUserDto(user: PrismaUser): User {
  return {
    id: user.id,
    orgId: user.orgId,
    email: user.email,
    name: user.name,
    role: user.role,
    disabled: user.disabled,
    createdAt: user.createdAt.toISOString(),
  };
}
