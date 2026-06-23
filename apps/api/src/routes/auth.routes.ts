import { Router } from 'express';
import {
  loginRequestSchema,
  registerRequestSchema,
  type AuthResponse,
  type MeResponse,
} from '@basira/shared';
import { asyncHandler } from '../http/async-handler.js';
import { parseBody } from '../http/validate.js';
import { login, register } from '../services/auth.service.js';
import { setAuthCookie, clearAuthCookie } from '../auth/cookie.js';
import { requireAuth } from '../auth/middleware.js';
import { getAuthUser } from '../auth/context.js';
import { prisma } from '../lib/db.js';
import { toUserDto } from '../serializers/user.serializer.js';

export const authRoutes: Router = Router();

authRoutes.post(
  '/auth/register',
  asyncHandler<AuthResponse>(async (req, res) => {
    const input = parseBody(registerRequestSchema, req);
    const { user, token } = await register(input);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  }),
);

authRoutes.post(
  '/auth/login',
  asyncHandler<AuthResponse>(async (req, res) => {
    const input = parseBody(loginRequestSchema, req);
    const { user, token } = await login(input);
    setAuthCookie(res, token);
    res.json({ user });
  }),
);

authRoutes.post('/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRoutes.get(
  '/auth/me',
  requireAuth,
  asyncHandler<MeResponse>(async (req, res) => {
    const { id } = getAuthUser(req);
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    res.json({ user: toUserDto(user) });
  }),
);
