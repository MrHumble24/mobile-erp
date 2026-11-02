import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateLookupInput,
  LookupView,
  UpdateLookupInput,
} from './types/qc.types.js';

const select = {
  code: true,
  label: true,
  sortOrder: true,
  isActive: true,
} as const;

function listArgs(includeInactive: boolean) {
  return {
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: 'asc' } as const,
    select,
  };
}

/** Prisma access for the two QC lookups: defect types and cosmetic grades. */
@Injectable()
export class QcLookupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listDefectTypes(includeInactive: boolean): Promise<LookupView[]> {
    return this.prisma.defectType.findMany(listArgs(includeInactive));
  }

  listGrades(includeInactive: boolean): Promise<LookupView[]> {
    return this.prisma.cosmeticGrade.findMany(listArgs(includeInactive));
  }

  createDefectType(input: CreateLookupInput): Promise<LookupView> {
    return this.prisma.defectType.create({ data: input, select });
  }

  createGrade(input: CreateLookupInput): Promise<LookupView> {
    return this.prisma.cosmeticGrade.create({ data: input, select });
  }

  updateDefectType(
    code: string,
    input: UpdateLookupInput,
  ): Promise<LookupView> {
    return this.prisma.defectType.update({
      where: { code },
      data: input,
      select,
    });
  }

  updateGrade(code: string, input: UpdateLookupInput): Promise<LookupView> {
    return this.prisma.cosmeticGrade.update({
      where: { code },
      data: input,
      select,
    });
  }
}
