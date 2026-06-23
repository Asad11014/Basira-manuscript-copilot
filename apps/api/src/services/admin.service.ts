import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AuditLog,
  AuditQuery,
  SeatUsage,
  User,
} from '@basira/shared';
import { prisma } from '../lib/db.js';
import { badRequest, conflict, notFound } from '../http/errors.js';
import { hashPassword } from '../auth/password.js';
import { toUserDto } from '../serializers/user.serializer.js';
import { toAuditLogDto } from '../serializers/audit.serializer.js';
import { recordAudit } from './audit.service.js';
import type { AuthUser } from '../auth/context.js';

export async function listUsers(admin: AuthUser): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: { orgId: admin.orgId },
    orderBy: { createdAt: 'asc' },
  });
  return users.map(toUserDto);
}

export async function createUser(
  admin: AuthUser,
  input: AdminCreateUserRequest,
): Promise<User> {
  const email = input.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw conflict('A user with this email already exists');
  }

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: admin.orgId },
  });
  const used = await prisma.user.count({ where: { orgId: admin.orgId } });
  if (used >= org.seatLimit) {
    throw conflict(`Seat limit reached (${org.seatLimit}). Increase the plan.`);
  }

  const user = await prisma.user.create({
    data: {
      orgId: admin.orgId,
      email,
      name: input.name,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
  });

  await recordAudit({
    orgId: admin.orgId,
    userId: admin.id,
    action: 'admin.user.create',
    targetType: 'user',
    targetId: user.id,
    metadata: { role: user.role },
  });
  return toUserDto(user);
}

export async function updateUser(
  admin: AuthUser,
  id: string,
  input: AdminUpdateUserRequest,
): Promise<User> {
  const target = await prisma.user.findFirst({
    where: { id, orgId: admin.orgId },
  });
  if (!target) throw notFound('User not found');
  if (target.id === admin.id && input.disabled === true) {
    throw badRequest('You cannot disable your own account');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: input.role, disabled: input.disabled },
  });
  await recordAudit({
    orgId: admin.orgId,
    userId: admin.id,
    action: 'admin.user.update',
    targetType: 'user',
    targetId: user.id,
    metadata: { role: input.role, disabled: input.disabled },
  });
  return toUserDto(user);
}

export async function listAudit(
  admin: AuthUser,
  query: AuditQuery,
): Promise<AuditLog[]> {
  const rows = await prisma.auditLog.findMany({
    where: {
      orgId: admin.orgId,
      createdAt: {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: query.limit ?? 100,
  });
  return rows.map(toAuditLogDto);
}

export async function seatUsage(admin: AuthUser): Promise<SeatUsage> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: admin.orgId },
  });
  const used = await prisma.user.count({ where: { orgId: admin.orgId } });
  return { seatLimit: org.seatLimit, used };
}
