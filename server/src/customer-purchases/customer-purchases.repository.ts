import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListCustomerPurchasesQueryDto } from './dto/list-customer-purchases.query.dto.js';

const PURCHASE_SELECT = {
  id: true,
  pricePaid: true,
  saleId: true,
  occurredAt: true,
  customer: { select: { id: true, name: true, phone: true } },
  device: {
    select: {
      id: true,
      imei: true,
      imei2: true,
      serialNumber: true,
      model: { select: { id: true, brand: true, name: true, kindCode: true } },
    },
  },
  createdBy: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.CustomerPurchaseSelect;

export type PurchaseRow = Prisma.CustomerPurchaseGetPayload<{
  select: typeof PURCHASE_SELECT;
}>;

/** Read-side Prisma access for customer purchases. Writes live in the write repo. */
@Injectable()
export class CustomerPurchasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<PurchaseRow | null> {
    return this.prisma.customerPurchase.findUnique({
      where: { id },
      select: PURCHASE_SELECT,
    });
  }

  async list(
    storeId: string,
    query: ListCustomerPurchasesQueryDto,
  ): Promise<{ items: PurchaseRow[]; total: number }> {
    const where = this.toWhere(storeId, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerPurchase.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: PURCHASE_SELECT,
      }),
      this.prisma.customerPurchase.count({ where }),
    ]);
    return { items, total };
  }

  /** Σ pricePaid of the trade-ins on a sale — feeds the refund cap (ADR 0039). */
  async tradeInTotalForSale(saleId: string): Promise<Prisma.Decimal> {
    const agg = await this.prisma.customerPurchase.aggregate({
      where: { saleId },
      _sum: { pricePaid: true },
    });
    return agg._sum.pricePaid ?? new Prisma.Decimal(0);
  }

  /**
   * Was this unit bought back (from a customer or as a trade-in) at or after the
   * given moment? Signals a sale whose unit has been bought back (ADR 0044),
   * which must no longer be returned. Excludes the sale's own trade-ins (a
   * different device) by keying on the sold unit's id.
   */
  async boughtBackAfter(deviceId: string, after: Date): Promise<boolean> {
    const count = await this.prisma.customerPurchase.count({
      where: { deviceId, occurredAt: { gte: after } },
    });
    return count > 0;
  }

  findTradeInsForSales(saleIds: string[]): Promise<PurchaseRow[]> {
    if (saleIds.length === 0) return Promise.resolve([]);
    return this.prisma.customerPurchase.findMany({
      where: { saleId: { in: saleIds } },
      select: PURCHASE_SELECT,
    });
  }

  private toWhere(
    storeId: string,
    query: ListCustomerPurchasesQueryDto,
  ): Prisma.CustomerPurchaseWhereInput {
    const code = query.search?.trim();
    return {
      storeId,
      customerId: query.customerId,
      occurredAt:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
      device: code
        ? {
            OR: [
              { imei: code },
              { imei2: code },
              { serialNumber: code.toUpperCase() },
            ],
          }
        : undefined,
    };
  }
}
