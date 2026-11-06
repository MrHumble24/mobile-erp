import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RUN_STATUS } from './types/backup.types.js';

/** Prisma access for restore-run audit rows (split from BackupsRepository). */
@Injectable()
export class RestoreRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  latestRestoreRun() {
    return this.prisma.restoreRun.findFirst({ orderBy: { startedAt: 'desc' } });
  }
}
