import { z } from 'zod';
import { ROLES } from '../constants.js';
import { idSchema } from './common.js';

export const adminCreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(ROLES),
  password: z.string().min(8).max(200),
});
export type AdminCreateUserRequest = z.infer<
  typeof adminCreateUserRequestSchema
>;

export const adminUpdateUserRequestSchema = z.object({
  role: z.enum(ROLES).optional(),
  disabled: z.boolean().optional(),
});
export type AdminUpdateUserRequest = z.infer<
  typeof adminUpdateUserRequestSchema
>;

export const auditLogSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  userId: idSchema.nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;

/** Seat usage view (seats modelled but billing inert in MVP). (§15) */
export const seatUsageSchema = z.object({
  seatLimit: z.number().int(),
  used: z.number().int(),
});
export type SeatUsage = z.infer<typeof seatUsageSchema>;
