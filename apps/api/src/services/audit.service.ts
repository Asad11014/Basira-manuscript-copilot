import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';

export interface AuditInput {
  orgId: string;
  userId?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append an audit-log entry. Audit logging must never break the user-facing
 * request, so failures are logged and swallowed. (§13 auditability, FR-18)
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: input.orgId,
        userId: input.userId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata ?? {},
      },
    });
  } catch (err) {
    logger.error({ err, action: input.action }, 'Failed to write audit log');
  }
}
