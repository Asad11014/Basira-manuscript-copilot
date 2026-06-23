import { Router } from 'express';
import {
  adminCreateUserRequestSchema,
  adminUpdateUserRequestSchema,
  auditQuerySchema,
  type AuditLog,
  type SeatUsage,
  type User,
} from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { param, parseBody, parseQuery } from '../http/validate.js';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import {
  createUser,
  listAudit,
  listUsers,
  seatUsage,
  updateUser,
} from '../services/admin.service.js';

export const adminRoutes: Router = Router();

adminRoutes.use(requireAuth, requireRole('admin'));

adminRoutes.get(
  '/users',
  asyncHandler<User[]>(async (req, res) => {
    res.json(await listUsers(getAuthUser(req)));
  }),
);

adminRoutes.post(
  '/users',
  asyncHandler<User>(async (req, res) => {
    const input = parseBody(adminCreateUserRequestSchema, req);
    res.status(201).json(await createUser(getAuthUser(req), input));
  }),
);

adminRoutes.patch(
  '/users/:id',
  asyncHandler<User>(async (req, res) => {
    const input = parseBody(adminUpdateUserRequestSchema, req);
    res.json(await updateUser(getAuthUser(req), param(req, 'id'), input));
  }),
);

adminRoutes.get(
  '/audit',
  asyncHandler<AuditLog[]>(async (req, res) => {
    const query = parseQuery(auditQuerySchema, req);
    res.json(await listAudit(getAuthUser(req), query));
  }),
);

adminRoutes.get(
  '/seats',
  asyncHandler<SeatUsage>(async (req, res) => {
    res.json(await seatUsage(getAuthUser(req)));
  }),
);
