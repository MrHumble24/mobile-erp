import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StorefrontDeliveryZonesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.prisma.deliveryZone.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findActive() {
    return this.prisma.deliveryZone.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.deliveryZone.findUnique({
      where: { id },
    });
  }

  create(data: {
    name: string;
    fee: number | Prisma.Decimal;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.deliveryZone.create({
      data: {
        name: data.name,
        fee: new Prisma.Decimal(data.fee),
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      fee?: number | Prisma.Decimal;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.fee !== undefined
          ? { fee: new Prisma.Decimal(data.fee) }
          : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.deliveryZone.delete({
      where: { id },
    });
  }

  async countOrdersForZone(zoneId: string) {
    return this.prisma.storefrontOrder.count({
      where: { deliveryZoneId: zoneId },
    });
  }
}
