import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ShipmentInput,
  ShipmentPatch,
  ShipmentTotals,
  ShipmentView,
} from './types/shipment.types.js';

const ZERO_TOTALS: ShipmentTotals = {
  unitExpenseTotal: '0.00',
  customsFeeTotal: '0.00',
  devicesWithoutCustomsFee: 0,
};

const withCount = {
  include: { _count: { select: { devices: true } } },
} as const;

/** Prisma access for shipment rows and their computed totals (no money of its
 * own; device intake and its ledger rows live in ShipmentsIntakeRepository). */
@Injectable()
export class ShipmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(storeIds?: string[]): Promise<ShipmentView[]> {
    const where: Prisma.ShipmentWhereInput = storeIds?.length
      ? { storeId: { in: storeIds } }
      : {};
    const rows = await this.prisma.shipment.findMany({
      where,
      orderBy: { shipmentDate: 'desc' },
      ...withCount,
    });
    const totals = await this.shipmentTotals(rows.map((r) => r.id));
    return rows.map((r) => toShipmentView(r, totals.get(r.id)));
  }

  async findById(
    id: string,
    storeIds?: string[],
  ): Promise<ShipmentView | null> {
    const where: Prisma.ShipmentWhereInput = {
      id,
      ...(storeIds?.length ? { storeId: { in: storeIds } } : {}),
    };
    const row = await this.prisma.shipment.findFirst({
      where,
      ...withCount,
    });
    if (!row) return null;
    const totals = await this.shipmentTotals([id]);
    return toShipmentView(row, totals.get(id));
  }

  async create(input: ShipmentInput): Promise<ShipmentView> {
    const row = await this.prisma.shipment.create({
      data: { ...input },
      ...withCount,
    });
    return toShipmentView(row, undefined);
  }

  /** Edits plain fields only; the shipment has no money of its own (ADR 0026). */
  async update(id: string, patch: ShipmentPatch): Promise<ShipmentView> {
    await this.prisma.shipment.update({ where: { id }, data: patch });
    const row = await this.prisma.shipment.findUniqueOrThrow({
      where: { id },
      ...withCount,
    });
    const totals = await this.shipmentTotals([id]);
    return toShipmentView(row, totals.get(id));
  }

  /** Per-shipment computed totals: expense sum, customs sum, un-stamped count. */
  private async shipmentTotals(
    shipmentIds: string[],
  ): Promise<Map<string, ShipmentTotals>> {
    if (shipmentIds.length === 0) return new Map();
    const [sums, noFee] = await Promise.all([
      this.prisma.device.groupBy({
        by: ['shipmentId'],
        where: { shipmentId: { in: shipmentIds } },
        _sum: { unitExpense: true, customsFee: true },
      }),
      this.prisma.device.groupBy({
        by: ['shipmentId'],
        where: { shipmentId: { in: shipmentIds }, customsFee: 0 },
        _count: { _all: true },
      }),
    ]);
    // shipmentId is nullable since ADR 0039 (customer-bought units); the `in`
    // filter guarantees non-null here, so drop any null defensively.
    const noFeeBy = new Map(
      noFee
        .filter((r) => r.shipmentId !== null)
        .map((r) => [r.shipmentId!, r._count._all]),
    );
    return new Map(
      sums
        .filter((r) => r.shipmentId !== null)
        .map((r) => [
          r.shipmentId!,
          {
            unitExpenseTotal: (
              r._sum.unitExpense ?? new Prisma.Decimal(0)
            ).toFixed(2),
            customsFeeTotal: (
              r._sum.customsFee ?? new Prisma.Decimal(0)
            ).toFixed(2),
            devicesWithoutCustomsFee: noFeeBy.get(r.shipmentId!) ?? 0,
          },
        ]),
    );
  }
}

interface ShipmentRow {
  id: string;
  supplierId: string;
  shipmentDate: Date;
  expectedCount: number;
  paymentAccountCode: string;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { devices: number };
}

function toShipmentView(
  row: ShipmentRow,
  totals: ShipmentTotals | undefined,
): ShipmentView {
  const t = totals ?? ZERO_TOTALS;
  return {
    id: row.id,
    supplierId: row.supplierId,
    shipmentDate: row.shipmentDate,
    expectedCount: row.expectedCount,
    paymentAccountCode: row.paymentAccountCode,
    notes: row.notes,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deviceCount: row._count.devices,
    unitExpenseTotal: t.unitExpenseTotal,
    customsFeeTotal: t.customsFeeTotal,
    // Placeholder: quantity purchases live in stock_movements, which this module
    // never reads — ShipmentsService fills this from StockService (ADR 0030/0034).
    stockLinesTotal: '0.00',
    devicesWithoutCustomsFee: t.devicesWithoutCustomsFee,
  };
}
