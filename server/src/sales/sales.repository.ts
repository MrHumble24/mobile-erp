import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { unitCodeWhere } from '../devices/lib/unit-code.js';
import { buildSaleWhere } from './lib/sale-where.js';
import { toReceiptView, toSaleView } from './lib/sale.mapper.js';
import { remainingWarrantyDays } from './lib/warranty.js';
import type {
  DeviceState,
  ReceiptView,
  SaleFilters,
  SaleForReturn,
  SaleRow,
  SaleStatsView,
  SaleView,
  WarrantyLookupView,
} from './types/sale.types.js';
import { saleSelect } from './lib/sale-select.js';

/** Read-side Prisma access for sales. Transactional writes live in the checkout repository. */
@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async findRow(
    id: string,
    storeIds?: string[],
  ): Promise<SaleRow | null> {
    const where: Prisma.SaleWhereInput = {
      id,
      ...(storeIds?.length ? { storeId: { in: storeIds } } : {}),
    };
    return this.prisma.sale.findFirst({ where, select: saleSelect });
  }

  async findById(id: string, storeIds?: string[]): Promise<SaleView | null> {
    const row = await this.findRow(id, storeIds);
    return row ? toSaleView(row) : null;
  }

  async receipt(id: string, storeIds?: string[]): Promise<ReceiptView | null> {
    const row = await this.findRow(id, storeIds);
    return row ? toReceiptView(row) : null;
  }

  async findByClientMutationId(
    clientMutationId: string,
  ): Promise<SaleView | null> {
    const row = await this.prisma.sale.findUnique({
      where: { clientMutationId },
      select: saleSelect,
    });
    return row ? toSaleView(row) : null;
  }

  async listByCustomer(
    customerId: string,
    storeIds: string[],
  ): Promise<SaleView[]> {
    const rows = await this.prisma.sale.findMany({
      where: {
        customerId,
        storeId: storeIds.length === 1 ? storeIds[0] : { in: storeIds },
      },
      orderBy: { soldAt: 'desc' },
      select: saleSelect,
    });
    return rows.map(toSaleView);
  }

  async list(
    filters: SaleFilters,
    storeIds?: string[],
  ): Promise<{
    items: SaleView[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where = buildSaleWhere(filters, storeIds);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        orderBy: { soldAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: saleSelect,
      }),
      this.prisma.sale.count({ where }),
    ]);
    return {
      items: rows.map(toSaleView),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async stats(
    filters: SaleFilters,
    storeIds?: string[],
  ): Promise<SaleStatsView> {
    const where = buildSaleWhere(filters, storeIds);
    const zero = new Prisma.Decimal(0);
    const [sales, returns] = await this.prisma.$transaction([
      this.prisma.sale.aggregate({
        where,
        _count: { _all: true },
        _sum: { salePrice: true, landedCostSnapshot: true },
        _avg: { salePrice: true },
      }),
      this.prisma.saleReturn.aggregate({
        where: { sale: where },
        _count: { _all: true },
        _sum: { refundAmount: true },
      }),
    ]);
    const revenue = sales._sum.salePrice ?? zero;
    const cost = sales._sum.landedCostSnapshot ?? zero;
    return {
      count: sales._count._all,
      revenue,
      avgPrice: sales._avg.salePrice ?? zero,
      returnedCount: returns._count._all,
      refundTotal: returns._sum.refundAmount ?? zero,
      netProfit: revenue.minus(cost),
    };
  }

  findDeviceByImei(
    code: string,
    storeId: string,
  ): Promise<{
    id: string;
    statusCode: string;
    version: number;
    landedCost: Prisma.Decimal;
    targetPrice: Prisma.Decimal | null;
    modelId: string;
    specs: Prisma.JsonValue;
    model: { salePrice: Prisma.Decimal | null };
  } | null> {
    return this.prisma.device.findFirst({
      where: {
        ...unitCodeWhere(code),
        storeId,
      },
      select: {
        id: true,
        statusCode: true,
        version: true,
        landedCost: true,
        targetPrice: true,
        modelId: true,
        specs: true,
        model: { select: { salePrice: true } },
      },
    });
  }

  async isDeviceHeldByOrder(
    deviceId: string,
    orderId: string,
  ): Promise<boolean> {
    const count = await this.prisma.storefrontOrder.count({
      where: {
        id: orderId,
        deviceId,
        statusCode: { in: ['NEW', 'CONTACTED', 'SHIPPED'] },
      },
    });
    return count > 0;
  }

  async customerExists(id: string): Promise<boolean> {
    return (await this.customerPricing(id)) !== null;
  }

  /** The customer's default level + standing discount, for checkout pricing. */
  customerPricing(id: string): Promise<{
    priceLevelCode: string;
    standingDiscountPercent: Prisma.Decimal;
  } | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      select: { priceLevelCode: true, standingDiscountPercent: true },
    });
  }

  /** The salePrice (per piece) of a quantity product, for its list price. */
  async modelSalePrice(modelId: string): Promise<Prisma.Decimal | null> {
    const row = await this.prisma.deviceModel.findUnique({
      where: { id: modelId },
      select: { salePrice: true },
    });
    return row?.salePrice ?? null;
  }

  findSaleForReturn(
    id: string,
    storeId: string,
  ): Promise<SaleForReturn | null> {
    const where: Prisma.SaleWhereInput = {
      id,
      storeId,
    };
    return this.prisma.sale.findFirst({
      where,
      select: {
        id: true,
        deviceId: true,
        modelId: true,
        quantity: true,
        storeId: true,
        creditId: true,
        salePrice: true,
        landedCostSnapshot: true,
        soldAt: true,
      },
    });
  }

  findDeviceState(id: string, storeId: string): Promise<DeviceState | null> {
    const where: Prisma.DeviceWhereInput = {
      id,
      storeId,
    };
    return this.prisma.device.findFirst({
      where,
      select: { id: true, statusCode: true, version: true },
    });
  }

  /** Store settings warranty days; 14 days when the row is absent. */
  async defaultWarrantyDays(storeId?: string): Promise<number> {
    const row = storeId
      ? await this.prisma.storeSettings.findUnique({
          where: { storeId },
          select: { defaultWarrantyDays: true },
        })
      : await this.prisma.storeSettings.findFirst({
          select: { defaultWarrantyDays: true },
        });
    return row?.defaultWarrantyDays ?? 14;
  }

  async warrantyLookup(
    code: string,
    activeStoreId?: string,
  ): Promise<WarrantyLookupView | null> {
    const sale = await this.prisma.sale.findFirst({
      where: { device: unitCodeWhere(code) },
      orderBy: { soldAt: 'desc' },
      select: {
        id: true,
        storeId: true,
        store: { select: { name: true } },
        salePrice: true,
        soldAt: true,
        deviceId: true,
        device: { select: { imei: true, serialNumber: true } },
        warranty: { select: { days: true, startsAt: true, endsAt: true } },
        return: { select: { saleId: true } },
      },
    });
    if (!sale || !sale.device || sale.deviceId === null) return null;
    const inspection = await this.prisma.qcInspection.findFirst({
      where: { deviceId: sale.deviceId },
      orderBy: { inspectedAt: 'desc' },
      select: { gradeCode: true, notes: true },
    });
    const isSameStore =
      activeStoreId !== undefined && sale.storeId === activeStoreId;
    return {
      imei: sale.device.imei,
      serialNumber: sale.device.serialNumber,
      saleId: sale.id,
      purchasedAt: sale.soldAt,
      salePrice: isSameStore ? sale.salePrice : null,
      storeName: sale.store?.name ?? null,
      warranty: sale.warranty,
      remainingDays: sale.warranty
        ? remainingWarrantyDays(sale.warranty.endsAt)
        : 0,
      latestInspection: inspection
        ? { grade: inspection.gradeCode, notes: inspection.notes }
        : null,
      alreadyReturned: sale.return !== null,
    };
  }
}
