import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface OrderListFilters {
  status?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

const USER_NAME_SELECT = {
  select: {
    id: true,
    profile: { select: { firstName: true, lastName: true } },
  },
} satisfies Prisma.UserDefaultArgs;

/**
 * Data access for staff-facing storefront orders (scoped strictly by storeId).
 */
@Injectable()
export class StorefrontOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

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
        include: {
          store: { select: { name: true } },
          model: { select: { brand: true, name: true } },
          status: { select: { label: true } },
          handledBy: USER_NAME_SELECT,
        },
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
      include: {
        store: { select: { name: true } },
        model: { select: { brand: true, name: true } },
        status: { select: { label: true } },
        handledBy: USER_NAME_SELECT,
        statusHistory: {
          include: {
            toStatus: { select: { label: true } },
            changedBy: USER_NAME_SELECT,
          },
          orderBy: { changedAt: 'asc' },
        },
      },
    });
  }

  findSaleInStore(storeId: string, saleId: string) {
    return this.prisma.sale.findFirst({
      where: { id: saleId, storeId },
      select: { id: true },
    });
  }

  async updateOrderStatus(
    storeId: string,
    id: string,
    fromStatusCode: string,
    toStatusCode: string,
    userId: string,
    saleId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.storefrontOrder.update({
        where: { id },
        data: {
          statusCode: toStatusCode,
          handledById: userId,
          handledAt: new Date(),
          ...(saleId ? { saleId } : {}),
        },
        include: {
          store: { select: { name: true } },
          model: { select: { brand: true, name: true } },
          status: { select: { label: true } },
          handledBy: USER_NAME_SELECT,
          statusHistory: {
            include: {
              toStatus: { select: { label: true } },
              changedBy: USER_NAME_SELECT,
            },
            orderBy: { changedAt: 'asc' },
          },
        },
      });

      await tx.storefrontOrderStatusHistory.create({
        data: {
          orderId: id,
          fromStatusCode,
          toStatusCode,
          changedById: userId,
        },
      });

      return order;
    });
  }
}
