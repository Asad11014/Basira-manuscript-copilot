import { z } from 'zod';
import { idSchema } from './common.js';

/** Organization — the tenant boundary. A user only ever sees their org's data. (§14) */
export const organizationSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(200),
  plan: z.string().default('free'),
  seatLimit: z.number().int().min(1).default(5),
  createdAt: z.string().datetime(),
});
export type Organization = z.infer<typeof organizationSchema>;
