import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RUN_STATUS } from './types/backup.types.js';

const SETTINGS_ID = 'default';

/** All Prisma access for backup runs, targets, settings and restore runs. */
@Injectable()
export class BackupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- settings -------------------------------------------------------------
  async getSettings() {
    const row = await this.prisma.backupSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    return (
      row ?? {
        id: SETTINGS_ID,
        scheduleEnabled: false,
        scheduleTime: '03:00',
        keepLast: 14,
        lastRunOn: null,
        updatedAt: new Date(0),
      }
    );
  }

  updateSettings(data: {
    scheduleEnabled?: boolean;
    scheduleTime?: string;
    keepLast?: number;
  }) {
    return this.prisma.backupSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });
  }

  markScheduleRan(on: Date) {
    return this.prisma.backupSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, lastRunOn: on },
      update: { lastRunOn: on },
    });
  }

  // --- runs -----------------------------------------------------------------
  createRun(triggeredById: string | null, migrationName: string | null) {
    return this.prisma.backupRun.create({
      data: { triggeredById, migrationName, statusCode: RUN_STATUS.RUNNING },
    });
  }

  finishRun(
    id: string,
    data: { fileName: string; sizeBytes: bigint; checksum: string },
  ) {
    return this.prisma.backupRun.update({
      where: { id },
      data: { ...data, statusCode: RUN_STATUS.SUCCESS, finishedAt: new Date() },
    });
  }

  failRun(id: string, error: string) {
    return this.prisma.backupRun.update({
      where: { id },
      data: { statusCode: RUN_STATUS.FAILED, error, finishedAt: new Date() },
    });
  }

  listRuns(take = 100) {
    return this.prisma.backupRun.findMany({
      orderBy: { startedAt: 'desc' },
      take,
      include: { targets: true },
    });
  }

  getRun(id: string) {
    return this.prisma.backupRun.findUnique({
      where: { id },
      include: { targets: true },
    });
  }

  deleteRun(id: string) {
    return this.prisma.backupRun.delete({ where: { id } });
  }

  /** Runs left RUNNING by a crash become FAILED at start-up. */
  markStaleRunsFailed() {
    return this.prisma.backupRun.updateMany({
      where: { statusCode: RUN_STATUS.RUNNING },
      data: {
        statusCode: RUN_STATUS.FAILED,
        error: 'Interrupted (server restarted mid-run)',
        finishedAt: new Date(),
      },
    });
  }

  // --- reconcile (T2) -------------------------------------------------------
  /** A backup file on disk with no row: create a SUCCESS run + LOCAL target. */
  insertReconciledRun(d: {
    id: string;
    createdAt: Date;
    fileName: string;
    sizeBytes: bigint;
  }) {
    return this.prisma.backupRun.create({
      data: {
        id: d.id,
        statusCode: RUN_STATUS.SUCCESS,
        startedAt: d.createdAt,
        finishedAt: new Date(),
        fileName: d.fileName,
        sizeBytes: d.sizeBytes,
        targets: {
          create: {
            providerCode: 'LOCAL',
            statusCode: 'UPLOADED',
            remoteRef: d.fileName,
          },
        },
      },
    });
  }

  /** A RUNNING row whose file exists becomes SUCCESS with a LOCAL target. */
  async reconcileToSuccess(
    id: string,
    data: { fileName: string; sizeBytes: bigint },
  ): Promise<void> {
    await this.prisma.backupRun.update({
      where: { id },
      data: {
        ...data,
        statusCode: RUN_STATUS.SUCCESS,
        finishedAt: new Date(),
        error: null,
      },
    });
    const existing = await this.prisma.backupTarget.findFirst({
      where: { runId: id, providerCode: 'LOCAL' },
    });
    if (existing) {
      await this.prisma.backupTarget.update({
        where: { id: existing.id },
        data: { statusCode: 'UPLOADED', remoteRef: data.fileName, error: null },
      });
    } else {
      await this.prisma.backupTarget.create({
        data: {
          runId: id,
          providerCode: 'LOCAL',
          statusCode: 'UPLOADED',
          remoteRef: data.fileName,
        },
      });
    }
  }

  /** A LOCAL target whose file is gone is marked FAILED. */
  markLocalTargetMissing(targetId: string) {
    return this.prisma.backupTarget.update({
      where: { id: targetId },
      data: { statusCode: 'FAILED', error: 'file missing on the server' },
    });
  }

  latestRestoreRun() {
    return this.prisma.restoreRun.findFirst({ orderBy: { startedAt: 'desc' } });
  }

  // --- targets --------------------------------------------------------------
  createTarget(runId: string, providerCode: string, statusCode: string) {
    return this.prisma.backupTarget.create({
      data: { runId, providerCode, statusCode },
    });
  }

  updateTarget(
    id: string,
    data: { statusCode: string; remoteRef?: string; error?: string },
  ) {
    return this.prisma.backupTarget.update({ where: { id }, data });
  }

  /** Successful deliveries for one provider, newest first (for retention). */
  uploadedTargets(providerCode: string) {
    return this.prisma.backupTarget.findMany({
      where: { providerCode, statusCode: 'UPLOADED', remoteRef: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: { run: true },
    });
  }

  deleteTarget(id: string) {
    return this.prisma.backupTarget.delete({ where: { id } });
  }

  /** Runs that have no delivered copy left anywhere (prune after retention). */
  deleteOrphanRuns() {
    return this.prisma.backupRun.deleteMany({
      where: { statusCode: 'SUCCESS', targets: { none: {} } },
    });
  }

  // --- providers ------------------------------------------------------------
  listProviders() {
    return this.prisma.backupProvider.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // --- restore runs ---------------------------------------------------------
  createRestoreRun(data: {
    performedById: string;
    sourceRunId: string | null;
    sourceLabel: string;
  }) {
    return this.prisma.restoreRun.create({
      data: { ...data, statusCode: RUN_STATUS.RUNNING },
    });
  }

  /**
   * Record a restore's outcome. Upsert, not update: a successful restore
   * replaces the whole database — including the RUNNING row written before it —
   * so on success we re-insert the audit row; on a rolled-back failure the row
   * survived and we update it.
   */
  upsertRestoreOutcome(
    id: string,
    base: {
      performedById: string;
      sourceRunId: string | null;
      sourceLabel: string;
    },
    status: 'SUCCESS' | 'FAILED',
    extra: { safetyRunId?: string; error?: string } = {},
  ) {
    return this.prisma.restoreRun.upsert({
      where: { id },
      create: {
        id,
        ...base,
        statusCode: status,
        finishedAt: new Date(),
        ...extra,
      },
      update: { statusCode: status, finishedAt: new Date(), ...extra },
    });
  }

  /** Major version of the running Postgres server (e.g. 17). */
  async serverMajor(): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ v: string }[]>`
      SELECT current_setting('server_version_num') AS v`;
    const num = Number(rows[0]?.v ?? '0');
    return Math.floor(num / 10000);
  }

  /** Last applied Prisma migration in the current database. */
  async lastAppliedMigration(): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at DESC LIMIT 1`;
    return rows[0]?.migration_name ?? null;
  }
}
