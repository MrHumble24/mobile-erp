import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ALWAYS_TABLES,
  CATALOG_TABLES,
  CONTACTS_TABLES,
  tablesToErase,
  tablesToReset,
  type WipeOptions,
} from './lib/wipe-tables.js';
import type { WipePreview, WipeRunView } from './types/data-wipe.types.js';

const RUNNING = 'RUNNING';

/** All Prisma access for the data wipe and factory reset. Table names come only
 * from compile-time constants — never from a request — so no identifier in any
 * SQL string is attacker-controlled. */
@Injectable()
export class DataWipeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Rows each group holds right now (for the confirm dialog's real numbers). */
  async preview(): Promise<WipePreview> {
    const [always, contacts, catalog] = await Promise.all([
      this.groupCount(ALWAYS_TABLES),
      this.groupCount(CONTACTS_TABLES),
      this.groupCount(CATALOG_TABLES),
    ]);
    return { always, contacts, catalog };
  }

  private async groupCount(tables: readonly string[]): Promise<number> {
    if (tables.length === 0) return 0;
    const union = tables
      .map((t) => `SELECT count(*)::bigint c FROM "${t}"`)
      .join(' UNION ALL ');
    const rows = await this.prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COALESCE(SUM(c), 0)::bigint total FROM (${union}) x`,
    );
    return Number(rows[0]?.total ?? 0);
  }

  /** Picture file names to delete after a catalog erase (collected first). */
  async catalogImageFileNames(): Promise<string[]> {
    const rows = await this.prisma.deviceModel.findMany({
      where: { imageFileName: { not: null } },
      select: { imageFileName: true },
    });
    return rows
      .map((r) => r.imageFileName)
      .filter((n): n is string => n !== null);
  }

  /**
   * Delete every table of the chosen groups in one transaction, in FK-safe
   * order and without CASCADE. If any statement throws, the whole transaction
   * rolls back — nothing is erased. Returns rows deleted per table.
   */
  async erase(opts: WipeOptions): Promise<Record<string, number>> {
    const tables = tablesToErase(opts);
    return this.prisma.$transaction(
      async (tx) => {
        const counts: Record<string, number> = {};
        for (const table of tables) {
          counts[table] = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
        }
        return counts;
      },
      { timeout: 120_000, maxWait: 15_000 },
    );
  }

  /**
   * Delete everything a factory reset erases, in FK-safe order and without
   * CASCADE. Only the safety backup run (if provided) is spared in backup_runs.
   * If any statement throws, Postgres rolls back — nothing is erased.
   */
  async reset(safetyRunId: string | null): Promise<Record<string, number>> {
    const tables = tablesToReset();
    return this.prisma.$transaction(
      async (tx) => {
        const counts: Record<string, number> = {};
        for (const table of tables) {
          counts[table] = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
        }
        await tx.$executeRawUnsafe(
          `INSERT INTO "stores" ("id", "name", "updatedAt") VALUES (gen_random_uuid(), 'Main store', now())`,
        );
        await tx.$executeRawUnsafe(
          `INSERT INTO "company_profiles" ("id", "name", "themeCode", "defaultLanguage", "timeZone", "currencyCode", "currencySign", "currencySignPosition", "currencyDecimals", "sessionDuration", "updatedAt")
           VALUES ('default', 'Malika ERP', 'caldera', 'uz', 'Asia/Tashkent', 'USD', '$', 'before', 2, '12h', now())`,
        );
        await tx.$executeRawUnsafe(
          `INSERT INTO "storefront_settings" ("id", "enabled", "showPrices", "categoryIds", "updatedAt")
           VALUES (1, false, true, '[]'::jsonb, now())`,
        );
        if (safetyRunId) {
          counts['backup_runs'] = await tx.$executeRawUnsafe(
            `DELETE FROM "backup_runs" WHERE "id" != $1`,
            safetyRunId,
          );
        } else {
          counts['backup_runs'] = await tx.$executeRawUnsafe(
            `DELETE FROM "backup_runs"`,
          );
        }
        return counts;
      },
      { timeout: 120_000, maxWait: 15_000 },
    );
  }

  createRun(data: {
    performedById: string;
    performedByName?: string;
    contacts: boolean;
    catalog: boolean;
    safetyRunId: string | null;
  }) {
    return this.prisma.dataWipeRun.create({
      data: { ...data, statusCode: RUNNING },
    });
  }

  finishRun(
    id: string,
    data: {
      status: 'SUCCESS' | 'FAILED';
      rowsErased: Record<string, number>;
      error?: string;
    },
  ) {
    return this.prisma.dataWipeRun.update({
      where: { id },
      data: {
        statusCode: data.status,
        rowsErased: data.rowsErased,
        error: data.error ?? null,
        finishedAt: new Date(),
      },
    });
  }

  async listRuns(take = 50): Promise<WipeRunView[]> {
    const runs = await this.prisma.dataWipeRun.findMany({
      orderBy: { startedAt: 'desc' },
      take,
    });
    // Resolve the performer's email for display. If the user was erased by a
    // factory reset, performedByName preserves their identity as text.
    const ids = [...new Set(runs.map((r) => r.performedById))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true },
    });
    const emailById = new Map(users.map((u) => [u.id, u.email]));
    return runs.map((r) => ({
      id: r.id,
      performedById: r.performedById,
      performedByEmail:
        r.performedByName ?? emailById.get(r.performedById) ?? null,
      contacts: r.contacts,
      catalog: r.catalog,
      safetyRunId: r.safetyRunId,
      rowsErased: (r.rowsErased ?? {}) as Record<string, number>,
      startedAt: r.startedAt.toISOString(),
      finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
      status: r.statusCode,
      error: r.error,
    }));
  }

  async latestRun() {
    return this.prisma.dataWipeRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });
  }

  /** A run left RUNNING by a crash becomes FAILED at start-up (the erase itself
   * is atomic, so the data is intact — only the audit row is stale). */
  markStaleRunsFailed() {
    return this.prisma.dataWipeRun.updateMany({
      where: { statusCode: 'RUNNING' },
      data: {
        statusCode: 'FAILED',
        error: 'Interrupted (server restarted mid-run)',
        finishedAt: new Date(),
      },
    });
  }
}
