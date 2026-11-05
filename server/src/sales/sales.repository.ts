import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { unitCodeWhere } from '../devices/lib/unit-code.js';
import { buildSaleWhere } from './lib/sale-where.js';
import { toReceiptView, toSaleView } from './lib/sale.mapper.js';
import { remainingWarrantyDays } from './lib/warranty.js';
import type {
  ReceiptView,
  SaleFilters,
  SaleRow,
  SaleStatsView,
  SaleView,
  WarrantyLookupView,
} from './types/sale.types.js';

const saleSelect = {
  id: true,
  salePrice: true,
  landedCostSnapshot: true,
  soldAt: true,
  consignmentId: true,
  notes: true,
  device: {
    select: {
      imei: true,
      imei2: true,
      serialNumber: true,
      specs: true,
      model: { select: { brand: true, name: true, kindCode: true } },
    },
  },
  customer: { select: { id: true, name: true, phone: true } },
  soldBy: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  warranty: { select: { days: true, startsAt: true, endsAt: true } },
  return: {
    select: {
      returnedAt: true,
      refundAmount: true,
      reason: true,
      processedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} as const;

/** Read-side Prisma access for sales. Transactional writes live in the checkout repository. */
@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async findRow(id: string): Promise<SaleRow | null> {
    return this.prisma.sale.findUnique({ where: { id }, select: saleSelect });
  }

  async findById(id: string): Promise<SaleView | null> {
    const row = await this.findRow(id);
    return row ? toSaleView(row) : null;
  }

  async receipt(id: string): Promise<ReceiptView | null> {
    const row = await this.findRow(id);
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

  async listByCustomer(customerId: string): Promise<SaleView[]> {
    const rows = await this.prisma.sale.findMany({
      where: { customerId },
      orderBy: { soldAt: 'desc' },
      select: saleSelect,
    });
    return rows.map(toSaleView);
  }

  async list(filters: SaleFilters): Promise<{
    items: SaleView[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where = buildSaleWhere(filters);
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

  async stats(filters: SaleFilters): Promise<SaleStatsView> {
    const where = buildSaleWhere(filters);
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

  findDeviceByImei(code: string): Promise<{
    id: string;
    statusCode: string;
    version: number;
    landedCost: Prisma.Decimal;
    targetPrice: Prisma.Decimal | null;
  } | null> {
    return this.prisma.device.findFirst({
      where: unitCodeWhere(code),
      select: {
        id: true,
        statusCode: true,
        version: true,
        landedCost: true,
        targetPrice: true,
      },
    });
  }

  async customerExists(id: string): Promise<boolean> {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });
    return row !== null;
  }

  findSaleForReturn(id: string): Promise<{
    id: string;
    deviceId: string;
    storeId: string;
    salePrice: Prisma.Decimal;
  } | null> {
    return this.prisma.sale.findUnique({
      where: { id },
      select: { id: true, deviceId: true, storeId: true, salePrice: true },
    });
  }

  findDeviceState(
    id: string,
  ): Promise<{ id: string; statusCode: string; version: number } | null> {
    return this.prisma.device.findUnique({
      where: { id },
      select: { id: true, statusCode: true, version: true },
    });
  }

  /** store_settings is a singleton (id = 1); 14 days when the row is absent. */
  async defaultWarrantyDays(): Promise<number> {
    const row = await this.prisma.storeSettings.findUnique({
      where: { id: 1 },
      select: { defaultWarrantyDays: true },
    });
    return row?.defaultWarrantyDays ?? 14;
  }

  async warrantyLookup(code: string): Promise<WarrantyLookupView | null> {
    const sale = await this.prisma.sale.findFirst({
      where: { device: unitCodeWhere(code) },
      orderBy: { soldAt: 'desc' },
      select: {
        id: true,
        salePrice: true,
        soldAt: true,
        deviceId: true,
        device: { select: { imei: true, serialNumber: true } },
        warranty: { select: { days: true, startsAt: true, endsAt: true } },
        return: { select: { saleId: true } },
      },
    });
    if (!sale) return null;
    const inspection = await this.prisma.qcInspection.findFirst({
      where: { deviceId: sale.deviceId },
      orderBy: { inspectedAt: 'desc' },
      select: { gradeCode: true, notes: true },
    });
    return {
      imei: sale.device.imei,
      serialNumber: sale.device.serialNumber,
      saleId: sale.id,
      purchasedAt: sale.soldAt,
      salePrice: sale.salePrice,
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
