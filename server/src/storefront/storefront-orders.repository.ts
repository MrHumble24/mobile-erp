import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface OrderListFilters {
  status?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface CreateStorefrontOrderInput {
  storeId: string;
  modelId: string;
  specs: Record<string, unknown>;
  customerName: string;
  customerPhone: string;
  note?: string;
  fulfillmentMethodCode?: string;
  address?: string | null;
  deliveryZoneId?: string | null;
  paymentMethodCode?: string;
  priceSnapshot?: Prisma.Decimal | null;
  deliveryFeeSnapshot?: Prisma.Decimal;
}

const USER_NAME_SELECT = {
  select: {
    id: true,
    profile: { select: { firstName: true, lastName: true } },
  },
} satisfies Prisma.UserDefaultArgs;

const ORDER_INCLUDE = {
  store: { select: { name: true } },
  model: { select: { brand: true, name: true, kindCode: true } },
  status: { select: { label: true } },
  handledBy: USER_NAME_SELECT,
  fulfillmentMethod: { select: { label: true } },
  paymentMethod: { select: { label: true } },
  deliveryZone: { select: { name: true } },
  payments: {
    include: {
      provider: { select: { label: true } },
      status: { select: { label: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  statusHistory: {
    include: {
      toStatus: { select: { label: true } },
      changedBy: USER_NAME_SELECT,
    },
    orderBy: { changedAt: 'asc' },
  },
} as const;

@Injectable()
export class StorefrontOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    input: CreateStorefrontOrderInput,
  ): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.storefrontOrder.create({
        data: {
          storeId: input.storeId,
          modelId: input.modelId,
          specs: input.specs as Prisma.InputJsonValue,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          note: input.note ?? null,
          fulfillmentMethodCode: input.fulfillmentMethodCode ?? 'PICKUP',
          address: input.address ?? null,
          deliveryZoneId: input.deliveryZoneId ?? null,
          paymentMethodCode: input.paymentMethodCode ?? 'ON_RECEIPT',
          priceSnapshot: input.priceSnapshot ?? null,
          deliveryFeeSnapshot:
            input.deliveryFeeSnapshot ?? new Prisma.Decimal(0),
          statusCode: 'NEW',
        },
        select: { id: true },
      });
      await tx.storefrontOrderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatusCode: 'NEW',
          note: 'Online order created',
        },
      });
      return order;
    });
  }

  findPublicOrderById(id: string) {
    return this.prisma.storefrontOrder.findUnique({
      where: { id },
      select: {
        id: true,
        statusCode: true,
        status: { select: { label: true } },
        fulfillmentMethodCode: true,
        model: { select: { brand: true, name: true } },
        priceSnapshot: true,
        deliveryFeeSnapshot: true,
        paymentMethodCode: true,
        payments: { select: { statusCode: true } },
      },
    });
  }

  async listOrders(storeId: string, filters: OrderListFilters) {
    const where: Prisma.StorefrontOrderWhereInput = { storeId };
    if (filters.status) where.statusCode = filters.status;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const [items, total] = await Promise.all([
      this.prisma.storefrontOrder.findMany({
        where,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.storefrontOrder.count({ where }),
    ]);
    return { items, total };
  }

  countNewOrders(storeId: string): Promise<number> {
    return this.prisma.storefrontOrder.count({
      where: { storeId, statusCode: 'NEW' },
    });
  }

  findOrderById(storeId: string, id: string) {
    return this.prisma.storefrontOrder.findFirst({
      where: { id, storeId },
      include: ORDER_INCLUDE,
    });
  }

  findSaleInStore(storeId: string, saleId: string) {
    return this.prisma.sale.findFirst({
      where: { id: saleId, storeId },
      select: { id: true },
    });
  }

  async findOldestInStockUnit(
    modelId: string,
    storeId: string,
    specs?: Record<string, unknown>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const conditions: Prisma.DeviceWhereInput[] = [
      { modelId, storeId, statusCode: 'IN_STOCK' },
    ];
    if (specs?.storage)
      conditions.push({ specs: { path: ['storage'], equals: specs.storage } });
    if (specs?.color)
      conditions.push({ specs: { path: ['color'], equals: specs.color } });
    return client.device.findFirst({
      where: conditions.length === 1 ? conditions[0] : { AND: conditions },
      orderBy: { createdAt: 'asc' },
    });
  }

  findUnitById(
    deviceId: string,
    storeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.device.findFirst({ where: { id: deviceId, storeId } });
  }

  async holdDevice(
    orderId: string,
    deviceId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (t: Prisma.TransactionClient) => {
      try {
        const updated = await t.device.updateMany({
          where: { id: deviceId, statusCode: 'IN_STOCK' },
          data: { statusCode: 'RESERVED', version: { increment: 1 } },
        });
        if (updated.count === 0) {
          throw new ConflictException({
            code: 'DEVICE_NOT_AVAILABLE',
            message: 'Device is no longer in stock or already reserved',
          });
        }
        await t.deviceStatusHistory.create({
          data: {
            deviceId,
            fromStatusCode: 'IN_STOCK',
            toStatusCode: 'RESERVED',
            changedById: userId,
            reason: `Hold for order #${orderId}`,
          },
        });
        await t.storefrontOrder.update({
          where: { id: orderId },
          data: { deviceId },
        });
      } catch (e) {
        if (isUniqueViolation(e)) {
          throw new ConflictException({
            code: 'DEVICE_ALREADY_RESERVED',
            message: 'Device is already held by another open order',
          });
        }
        throw e;
      }
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async releaseDevice(
    orderId: string,
    deviceId: string,
    userId: string,
    tx: Prisma.TransactionClient,
  ) {
    await tx.device.updateMany({
      where: { id: deviceId, statusCode: 'RESERVED' },
      data: { statusCode: 'IN_STOCK', version: { increment: 1 } },
    });
    await tx.deviceStatusHistory.create({
      data: {
        deviceId,
        fromStatusCode: 'RESERVED',
        toStatusCode: 'IN_STOCK',
        changedById: userId,
        reason: `Released from cancelled order #${orderId}`,
      },
    });
    await tx.storefrontOrder.update({
      where: { id: orderId },
      data: { deviceId: null },
    });
  }

  async updateOrderStatus(
    storeId: string,
    id: string,
    fromStatusCode: string,
    toStatusCode: string,
    userId: string,
    saleId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (t: Prisma.TransactionClient) => {
      const updateRes = await t.storefrontOrder.updateMany({
        where: { id, storeId },
        data: {
          statusCode: toStatusCode,
          handledById: userId,
          handledAt: new Date(),
          ...(saleId ? { saleId } : {}),
        },
      });
      if (updateRes.count === 0) {
        throw new NotFoundException(`Order ${id} not found in this store`);
      }
      await t.storefrontOrderStatusHistory.create({
        data: {
          orderId: id,
          fromStatusCode,
          toStatusCode,
          changedById: userId,
        },
      });
      return t.storefrontOrder.findFirstOrThrow({
        where: { id, storeId },
        include: ORDER_INCLUDE,
      });
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }
}
