import 'dotenv/config';
import * as argon2 from 'argon2';
import { parseResetPasswordInput } from '../src/users/lib/reset-password-input.js';
import { SessionGateService } from '../src/common/runtime/session-gate.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Locked-out-owner recovery on the server host (ADR 0053): sets a new password
 * from RESET_EMAIL / RESET_PASSWORD, reactivates the account, and ends every
 * session. Environment only — arguments leak into shell history and `ps`.
 *
 * Talks to the database only, like bootstrap-admin.ts: booting Nest under tsx
 * leaves injected services undefined.
 */
async function main(): Promise<void> {
  const input = parseResetPasswordInput(process.env);
  if (!input.ok) {
    console.error(input.message);
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        roles: { select: { roleCode: true } },
      },
    });
    if (!user) {
      console.error('No user with this email');
      process.exitCode = 1;
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await argon2.hash(input.password), isActive: true },
    });
    // The app has one shop-wide cutoff, not a per-user mechanism.
    await new SessionGateService(prisma).endAllSessions();

    if (!user.roles.some((role) => role.roleCode === 'ADMIN')) {
      console.log('This account is not an admin.');
    }
    console.log(
      `Password reset for ${user.email}. All sessions ended — everyone must sign in again.`,
    );
  } finally {
    await prisma.onModuleDestroy();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
