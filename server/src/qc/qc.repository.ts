import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateInspectionInput,
  LookupView,
  QcInspectionView,
} from './types/qc.types.js';

const inspectionInclude = {
  include: { defects: { select: { defectCode: true, notes: true } } },
} as const;

const lookupArgs = {
  where: { isActive: true },
  orderBy: { sortOrder: 'asc' },
  select: { code: true, label: true, sortOrder: true },
} as const;

/** All Prisma access for QC inspections and QC lookups. */
@Injectable()
export class QcRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createInspection(
    input: CreateInspectionInput,
  ): Promise<QcInspectionView> {
    const row = await this.prisma.qcInspection.create({
      data: {
        deviceId: input.deviceId,
        inspectedById: input.inspectedById,
        passed: input.passed,
        gradeCode: input.gradeCode ?? null,
        batteryHealth: input.batteryHealth ?? null,
        repairCostEstimate: input.repairCostEstimate ?? null,
        notes: input.notes ?? null,
        defects: {
          create: input.defects.map((d) => ({
            defectCode: d.defectCode,
            notes: d.notes ?? null,
          })),
        },
      },
      ...inspectionInclude,
    });
    return toInspectionView(row);
  }

  async findByDevice(deviceId?: string): Promise<QcInspectionView[]> {
    const rows = await this.prisma.qcInspection.findMany({
      where: deviceId ? { deviceId } : {},
      orderBy: { inspectedAt: 'desc' },
      ...inspectionInclude,
    });
    return rows.map(toInspectionView);
  }

  listDefectTypes(): Promise<LookupView[]> {
    return this.prisma.defectType.findMany(lookupArgs);
  }

  listGrades(): Promise<LookupView[]> {
    return this.prisma.cosmeticGrade.findMany(lookupArgs);
  }
}

interface InspectionRow {
  id: string;
  deviceId: string;
  inspectedById: string;
  passed: boolean;
  gradeCode: string | null;
  batteryHealth: number | null;
  repairCostEstimate: { toString(): string } | null;
  notes: string | null;
  inspectedAt: Date;
  defects: { defectCode: string; notes: string | null }[];
}

function toInspectionView(row: InspectionRow): QcInspectionView {
  return {
    id: row.id,
    deviceId: row.deviceId,
    inspectedById: row.inspectedById,
    passed: row.passed,
    gradeCode: row.gradeCode,
    batteryHealth: row.batteryHealth,
    repairCostEstimate: row.repairCostEstimate
      ? row.repairCostEstimate.toString()
      : null,
    notes: row.notes,
    inspectedAt: row.inspectedAt,
    defects: row.defects,
  };
}
