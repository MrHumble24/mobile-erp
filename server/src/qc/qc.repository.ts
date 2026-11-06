import { Injectable } from '@nestjs/common';
import { unitCodeWhere } from '../devices/lib/unit-code.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateInspectionInput,
  InspectionFilters,
  PaginatedInspections,
  QcInspectionView,
} from './types/qc.types.js';
import {
  inspectionListInclude,
  InspectionListRow,
  toInspectionListItem,
  toInspectionView,
} from './lib/inspection-view.mapper.js';

/** All Prisma access for QC inspections (create + paginated list). */
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
      include: { defects: { select: { defectCode: true, notes: true } } },
    });
    return toInspectionView(row);
  }

  async list(
    filters: InspectionFilters,
    page: number,
    pageSize: number,
  ): Promise<PaginatedInspections> {
    const where = buildWhere(filters);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.qcInspection.findMany({
        where,
        orderBy: { inspectedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        ...inspectionListInclude,
      }),
      this.prisma.qcInspection.count({ where }),
    ]);
    const items = (rows as InspectionListRow[]).map(toInspectionListItem);
    return { items, total, page, pageSize };
  }
}

export function buildWhere(
  filters: InspectionFilters,
): Prisma.QcInspectionWhereInput {
  const where: Prisma.QcInspectionWhereInput = {};
  if (filters.deviceId) where.deviceId = filters.deviceId;
  if (filters.imei) where.device = unitCodeWhere(filters.imei);
  if (filters.passed !== undefined) where.passed = filters.passed;
  if (filters.gradeCode) where.gradeCode = filters.gradeCode;
  if (filters.inspectedById) where.inspectedById = filters.inspectedById;
  if (filters.defectCode) {
    where.defects = { some: { defectCode: filters.defectCode } };
  }
  if (filters.from || filters.to) {
    where.inspectedAt = {};
    if (filters.from) where.inspectedAt.gte = filters.from;
    if (filters.to) where.inspectedAt.lte = filters.to;
  }
  if (filters.storeIds) {
    const storeFilter =
      filters.storeIds.length === 1
        ? filters.storeIds[0]
        : { in: filters.storeIds };
    if (where.device) {
      where.device = {
        AND: [where.device, { storeId: storeFilter }],
      };
    } else {
      where.device = { storeId: storeFilter };
    }
  }
  return where;
}
