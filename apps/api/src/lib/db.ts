import { PrismaClient } from '@prisma/client';
import { isProd } from './config.js';

/**
 * Prisma singleton. In dev, tsx watch re-imports modules on change; cache the
 * client on globalThis to avoid exhausting the connection pool with reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!isProd) globalForPrisma.prisma = prisma;

export type Db = PrismaClient;
