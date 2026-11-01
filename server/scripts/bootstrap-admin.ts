import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Creates the first admin from BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD
 * and assigns the seeded ADMIN role. Idempotent: does nothing once any user
 * exists. Run after migrate + seed (see server/README.md).
 */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  try {
    if ((await prisma.user.count()) > 0) {
      console.log('Users already exist — skipping bootstrap.');
      return;
    }

    const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error(
        'Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD before running.',
      );
    }
    if (!(await prisma.role.findUnique({ where: { code: 'ADMIN' } }))) {
      throw new Error('ADMIN role missing — run the seed (pnpm prisma db seed).');
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(password),
        profile: { create: { firstName: 'Admin' } },
        roles: { create: { roleCode: 'ADMIN' } },
      },
    });
    console.log(`Created admin ${user.email} (${user.id}).`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
