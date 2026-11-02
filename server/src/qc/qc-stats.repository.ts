import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface ResultCount {
  passed: boolean;
  count: number;
}

export interface GradeCount {
  gradeCode: string;
  count: number;
}

export interface DefectCount {
  defectCode: string;
  count: number;
}

/** Aggregate Prisma queries behind the QC stats dashboard. */
@Injectable()
export class QcStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countsByResult(range: DateRange): Promise<ResultCount[]> {
    const rows = await this.prisma.qcInspection.groupBy({
      by: ['passed'],
      where: inspectionWhere(range),
      _count: { _all: true },
    });
    return rows.map((r) => ({ passed: r.passed, count: r._count._all }));
  }

  async avgBattery(range: DateRange): Promise<number | null> {
    const agg = await this.prisma.qcInspection.aggregate({
      where: inspectionWhere(range),
      _avg: { batteryHealth: true },
    });
    return agg._avg.batteryHealth;
  }

  async byGrade(range: DateRange): Promise<GradeCount[]> {
    const rows = await this.prisma.qcInspection.groupBy({
      by: ['gradeCode'],
      where: { ...inspectionWhere(range), gradeCode: { not: null } },
      _count: { _all: true },
    });
    return rows.map((r) => ({
      gradeCode: r.gradeCode as string,
      count: r._count._all,
    }));
  }

  async topDefects(range: DateRange): Promise<DefectCount[]> {
    const rows = await this.prisma.qcDefect.groupBy({
      by: ['defectCode'],
      where: { inspection: inspectionWhere(range) },
      _count: { _all: true },
      orderBy: { _count: { defectCode: 'desc' } },
      take: 10,
    });
    return rows.map((r) => ({
      defectCode: r.defectCode,
      count: r._count._all,
    }));
  }
}

function inspectionWhere(range: DateRange): Prisma.QcInspectionWhereInput {
  if (!range.from && !range.to) return {};
  const inspectedAt: Prisma.DateTimeFilter = {};
  if (range.from) inspectedAt.gte = range.from;
  if (range.to) inspectedAt.lte = range.to;
  return { inspectedAt };
}
