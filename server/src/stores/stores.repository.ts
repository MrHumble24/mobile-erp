import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStoreDto } from './dto/create-store.dto.js';
import { UpdateStoreDto } from './dto/update-store.dto.js';
import type { StoreIdentity, StoreView } from './types/store.types.js';

const ACTIVE_DEVICE_STATUSES = [
  'IN_STOCK',
  'DEFECTIVE',
  'CONSIGNED',
  'IN_TRANSIT',
  'RESERVED',
];

/** All Prisma access for the stores, user_stores, and store settings tables. */
@Injectable()
export class StoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async currentId(): Promise<string> {
    const row = await this.prisma.store.findFirst({
      where: { deactivatedAt: null },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    if (row) return row.id;
    const fallback = await this.prisma.store.findFirstOrThrow({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return fallback.id;
  }

  async getIdentity(storeId?: string): Promise<StoreIdentity> {
    const id = storeId ?? (await this.currentId());
    return this.prisma.store.findUniqueOrThrow({
      where: { id },
      select: { name: true, address: true, phone: true },
    });
  }

  async updateIdentity(
    id: string,
    data: Partial<StoreIdentity>,
  ): Promise<void> {
    await this.prisma.store.update({ where: { id }, data });
  }

  list(includeDeactivated = false): Promise<StoreView[]> {
    return this.prisma.store.findMany({
      where: includeDeactivated ? undefined : { deactivatedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string): Promise<StoreView | null> {
    return this.prisma.store.findUnique({ where: { id } });
  }

  create(dto: CreateStoreDto): Promise<StoreView> {
    return this.prisma.store.create({
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
      },
    });
  }

  update(
    id: string,
    dto: UpdateStoreDto & { deactivatedAt?: Date | null },
  ): Promise<StoreView> {
    return this.prisma.store.update({
      where: { id },
      data: dto,
    });
  }

  async createSettings(storeId: string): Promise<void> {
    await this.prisma.storeSettings.upsert({
      where: { storeId },
      create: { storeId },
      update: {},
    });
  }

  async listForUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.userStore.findMany({
      where: { userId },
      select: { storeId: true },
    });
    return rows.map((r) => r.storeId);
  }

  async setUserStores(userId: string, storeIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userStore.deleteMany({ where: { userId } });
      if (storeIds.length > 0) {
        await tx.userStore.createMany({
          data: storeIds.map((storeId) => ({ userId, storeId })),
        });
      }
    });
  }

  countDevices(storeId: string): Promise<number> {
    return this.prisma.device.count({
      where: {
        storeId,
        statusCode: { in: ACTIVE_DEVICE_STATUSES },
      },
    });
  }

  async countQuantityStock(storeId: string): Promise<number> {
    const [row] = await this.prisma.$queryRaw<{ total: number | null }[]>(
      Prisma.sql`SELECT coalesce(sum(quantity), 0)::int AS total
                 FROM stock_movements WHERE "storeId" = ${storeId}`,
    );
    return Math.max(0, row?.total ?? 0);
  }

  countOpenShifts(storeId: string): Promise<number> {
    return this.prisma.shift.count({
      where: {
        storeId,
        closedAt: null,
      },
    });
  }
}
