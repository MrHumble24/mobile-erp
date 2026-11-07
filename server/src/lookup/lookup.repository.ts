import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface BoxCodeRow {
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
}

export interface AppleModelNumberRow {
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
  boxCode: string | null;
}

export interface SamsungModelCodeRow {
  brand: string;
  model: string;
  series: string | null;
  codename: string | null;
  modelCode: string;
  storageOptions: string[];
  colorOptions: string[];
}

export interface AppleModelMatch {
  brand: string;
  model: string;
  modelNumber: string;
}

/** Prisma access for the reference lists and the learned links (ADR 0031). */
@Injectable()
export class LookupRepository {
  constructor(private readonly prisma: PrismaService) {}

  searchSamsung(query: string, limit = 8): Promise<SamsungModelCodeRow[]> {
    return this.prisma.referenceSamsungModelCode.findMany({
      where: {
        OR: [
          { model: { contains: query, mode: 'insensitive' } },
          { series: { contains: query, mode: 'insensitive' } },
          { modelCode: { contains: query, mode: 'insensitive' } },
        ],
      },
      distinct: ['model'],
      take: limit,
      select: {
        brand: true,
        model: true,
        series: true,
        codename: true,
        modelCode: true,
        storageOptions: true,
        colorOptions: true,
      },
    });
  }

  searchAppleModels(query: string, limit = 8): Promise<AppleModelMatch[]> {
    return this.prisma.referenceAppleModelNumber.findMany({
      where: {
        OR: [
          { model: { contains: query, mode: 'insensitive' } },
          { modelNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      distinct: ['model'],
      take: limit,
      select: {
        brand: true,
        model: true,
        modelNumber: true,
      },
    });
  }

  findAppleModelOptions(
    model: string,
  ): Promise<Array<{ storage: string | null; color: string | null }>> {
    return this.prisma.referenceAppleModelNumber.findMany({
      where: { model },
      select: {
        storage: true,
        color: true,
      },
    });
  }

  findBoxCode(boxCode: string): Promise<BoxCodeRow | null> {
    return this.prisma.referenceAppleBoxCode.findUnique({
      where: { boxCode },
      select: {
        brand: true,
        model: true,
        color: true,
        storage: true,
        ram: true,
      },
    });
  }

  findAppleModelNumbers(modelNumber: string): Promise<AppleModelNumberRow[]> {
    return this.prisma.referenceAppleModelNumber.findMany({
      where: { modelNumber },
      select: {
        brand: true,
        model: true,
        color: true,
        storage: true,
        ram: true,
        boxCode: true,
      },
    });
  }

  findSamsungModelCode(modelCode: string): Promise<SamsungModelCodeRow | null> {
    return this.prisma.referenceSamsungModelCode.findUnique({
      where: { modelCode },
      select: {
        brand: true,
        model: true,
        series: true,
        codename: true,
        modelCode: true,
        storageOptions: true,
        colorOptions: true,
      },
    });
  }

  findTac(tac: string): Promise<{ brand: string; model: string } | null> {
    return this.prisma.referenceImeiTac.findUnique({
      where: { tac },
      select: { brand: true, model: true },
    });
  }

  async findLinkModelId(refKey: string): Promise<string | null> {
    const row = await this.prisma.referenceModelLink.findUnique({
      where: { refKey },
      select: { modelId: true },
    });
    return row?.modelId ?? null;
  }

  /** One link per reference model: storing again replaces the target product. */
  async upsertLink(
    refKey: string,
    refBrand: string,
    refModel: string,
    modelId: string,
  ): Promise<void> {
    await this.prisma.referenceModelLink.upsert({
      where: { refKey },
      create: { refKey, refBrand, refModel, modelId },
      update: { refBrand, refModel, modelId },
    });
  }
}
