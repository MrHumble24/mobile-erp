import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface BoxCodeRow {
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
}

/** Prisma access for the reference lists and the learned links (ADR 0031). */
@Injectable()
export class LookupRepository {
  constructor(private readonly prisma: PrismaService) {}

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
