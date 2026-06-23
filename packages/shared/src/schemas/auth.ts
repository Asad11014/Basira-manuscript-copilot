import { z } from 'zod';
import { userSchema } from './user.js';

/** Password policy — kept deliberately simple for MVP; enforced server-side. */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200);

export const registerRequestSchema = z.object({
  orgName: z.string().min(1).max(200),
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1).max(200),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** Both register and login return the authenticated user (cookie holds the JWT). */
export const authResponseSchema = z.object({
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const meResponseSchema = z.object({
  user: userSchema,
});
export type MeResponse = z.infer<typeof meResponseSchema>;
