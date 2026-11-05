import type { PrismaService } from '../../prisma/prisma.service.js';

/**
 * The interactive-transaction client Prisma hands a `$transaction(fn)` callback.
 * Shared so one module can start a transaction and pass it into another's
 * repository (a credit cart drives sale checkouts inside its own tx, ADR 0035).
 */
export type PrismaTx = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];
