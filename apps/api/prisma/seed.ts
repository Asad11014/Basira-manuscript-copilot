import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Dev seed: one organization with an admin, editor, and viewer, plus a sample
 * project. Idempotent — safe to run repeatedly. Never use these credentials
 * outside local development.
 */
async function main() {
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org' },
    update: {},
    create: { id: 'seed-org', name: 'Demo Research Lab', plan: 'free', seatLimit: 10 },
  });

  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { email: 'admin@basira.test', name: 'Admin User', role: 'admin' as const },
    { email: 'editor@basira.test', name: 'Editor User', role: 'editor' as const },
    { email: 'viewer@basira.test', name: 'Viewer User', role: 'viewer' as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name },
      create: { ...u, orgId: org.id, passwordHash },
    });
  }

  await prisma.project.upsert({
    where: { id: 'seed-project' },
    update: {},
    create: {
      id: 'seed-project',
      orgId: org.id,
      name: 'Sample Collection',
      description: 'A starter project for exploring Basira.',
      tags: ['demo'],
    },
  });

  console.log('Seed complete. Login with admin@basira.test / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
