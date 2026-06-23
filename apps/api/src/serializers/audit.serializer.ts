import type { AuditLog as PrismaAuditLog } from '@prisma/client';
import type { AuditLog } from '@basira/shared';

export function toAuditLogDto(a: PrismaAuditLog): AuditLog {
  return {
    id: a.id,
    orgId: a.orgId,
    userId: a.userId,
    action: a.action,
    targetType: a.targetType,
    targetId: a.targetId,
    metadata: (a.metadata as Record<string, unknown>) ?? {},
    createdAt: a.createdAt.toISOString(),
  };
}
