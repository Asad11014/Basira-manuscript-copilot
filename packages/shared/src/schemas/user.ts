import { z } from 'zod';
import { ROLES } from '../constants.js';
import { idSchema } from './common.js';

/** Public user shape returned by the API. Never includes passwordHash. */
export const userSchema = z.object({
  id: idSchema,
  orgId: idSchema,
  email: z.string().email(),
  name: z.string().min(1).max(200),
  role: z.enum(ROLES),
  disabled: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;
