import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { computeLandedCost } from '../devices/lib/landed-cost.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  RegisteredDeviceView,
  RegisterDeviceInput,
  ShipmentInput,
  ShipmentPatch,
  ShipmentView,
} from './types/shipment.types.js';

const withCount = {
  include: { _count: { select: { devices: true } } },
} as const;

/** All Prisma access for shipments, including batched device intake. */
@Injectable()
export class ShipmentsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async findAll(): Promise<ShipmentView[]> {
    const rows = await this.prisma.shipment.findMany({
      orderBy: { shipmentDate: 'desc' },
      ...withCount,
    });
    const totals = await this.unitExpenseTotals(rows.map((r) => r.id));
    return rows.map((r) => toShipmentView(r, totals.get(r.id) ?? '0.00'));
  }

  async findById(id: string): Promise<ShipmentView | null> {
    const row = await this.prisma.shipment.findUnique({
      where: { id },
      ...withCount,
    });
    if (!row) return null;
    const totals = await this.unitExpenseTotals([id]);
    return toShipmentView(row, totals.get(id) ?? '0.00');
  }

  async create(input: ShipmentInput): Promise<ShipmentView> {
    const row = await this.prisma.shipment.create({
      data: { ...input },
      ...withCount,
    });
    return toShipmentView(row, '0.00');
  }

  /** Edits plain fields only; the shipment has no money of its own (ADR 0026). */
  async update(id: string, patch: ShipmentPatch): Promise<ShipmentView> {
    await this.prisma.shipment.update({ where: { id }, data: patch });
    const row = await this.prisma.shipment.findUniqueOrThrow({
      where: { id },
      ...withCount,
    });
    const totals = await this.unitExpenseTotals([id]);
    return toShipmentView(row, totals.get(id) ?? '0.00');
  }

  async addDevices(
    shipmentId: string,
    inputs: RegisterDeviceInput[],
    userId: string,
    storeId: string,
  ): Promise<RegisteredDeviceView[]> {
    return this.prisma.$transaction(async (tx) => {
      await this.assertImeisFree(tx, inputs);
      const shipment = await tx.shipment.findUniqueOrThrow({
        where: { id: shipmentId },
        select: { storeId: true, paymentAccountCode: true },
      });
      const results: RegisteredDeviceView[] = [];
      for (const input of inputs) {
        results.push(
          await this.registerOne(
            tx,
            shipmentId,
            storeId,
            shipment,
            input,
            userId,
          ),
        );
      }
      return results;
    });
  }

  private async registerOne(
    tx: Prisma.TransactionClient,
    shipmentId: string,
    storeId: string,
    shipment: { storeId: string; paymentAccountCode: string },
    input: RegisterDeviceInput,
    userId: string,
  ): Promise<RegisteredDeviceView> {
    const acquisitionCost = input.acquisitionCost;
    const unitExpense = input.unitExpense ?? 0;
    // customsFee is stamped by commit 3; it is 0 here.
    const landedCost = computeLandedCost(acquisitionCost, 0, unitExpense);
    const device = await tx.device.create({
      data: {
        imei: input.imei,
        imei2: input.imei2 ?? null,
        storeId,
        shipmentId,
        modelId: input.modelId,
        specs: input.specs as Prisma.InputJsonValue,
        acquisitionCost,
        unitExpense,
        unitExpenseNote: input.unitExpenseNote ?? null,
        landedCost,
        targetPrice: input.targetPrice ?? null,
        statusCode: 'IN_STOCK',
        statusHistory: {
          create: { toStatusCode: 'IN_STOCK', changedById: userId },
        },
      },
      select: { id: true, statusCode: true },
    });
    await this.postIntake(
      tx,
      shipment,
      device.id,
      shipmentId,
      acquisitionCost,
      unitExpense,
      userId,
    );
    return toRegisteredView(device, input, unitExpense, landedCost);
  }

  /** PURCHASE for the supplier price and DEVICE_EXPENSE for a non-zero expense. */
  private async postIntake(
    tx: Prisma.TransactionClient,
    shipment: { storeId: string; paymentAccountCode: string },
    deviceId: string,
    shipmentId: string,
    acquisitionCost: number,
    unitExpense: number,
    userId: string,
  ): Promise<void> {
    const acq = new Prisma.Decimal(acquisitionCost);
    if (acq.gt(0)) {
      await this.ledger.post(
        {
          storeId: shipment.storeId,
          accountCode: shipment.paymentAccountCode,
          typeCode: 'PURCHASE',
          amount: acq.negated(),
          deviceId,
          shipmentId,
          createdById: userId,
        },
        tx,
      );
    }
    const exp = new Prisma.Decimal(unitExpense);
    if (exp.gt(0)) {
      await this.ledger.post(
        {
          storeId: shipment.storeId,
          accountCode: shipment.paymentAccountCode,
          typeCode: 'DEVICE_EXPENSE',
          amount: exp.negated(),
          deviceId,
          shipmentId,
          createdById: userId,
        },
        tx,
      );
    }
  }

  /** Sum of each shipment's devices' unitExpense, as 2-dp strings. */
  private async unitExpenseTotals(
    shipmentIds: string[],
  ): Promise<Map<string, string>> {
    if (shipmentIds.length === 0) return new Map();
    const rows = await this.prisma.device.groupBy({
      by: ['shipmentId'],
      where: { shipmentId: { in: shipmentIds } },
      _sum: { unitExpense: true },
    });
    return new Map(
      rows.map((r) => [
        r.shipmentId,
        (r._sum.unitExpense ?? new Prisma.Decimal(0)).toFixed(2),
      ]),
    );
  }

  /**
   * Rejects an intake whose IMEIs collide — within the batch, between a unit's
   * own imei/imei2, or against either IMEI column of an existing device. The
   * single-column unique indexes cannot see cross-column clashes on their own.
   */
  private async assertImeisFree(
    tx: Prisma.TransactionClient,
    inputs: RegisterDeviceInput[],
  ): Promise<void> {
    const values: string[] = [];
    for (const d of inputs) {
      if (d.imei2 && d.imei2 === d.imei) {
        throw new BadRequestException(
          `imei2 must differ from imei (${d.imei})`,
        );
      }
      values.push(d.imei);
      if (d.imei2) values.push(d.imei2);
    }
    if (new Set(values).size !== values.length) {
      throw new ConflictException('Duplicate IMEI within the batch');
    }
    const clash = await tx.device.findFirst({
      where: { OR: [{ imei: { in: values } }, { imei2: { in: values } }] },
      select: { imei: true },
    });
    if (clash) {
      throw new ConflictException('A device with this IMEI already exists');
    }
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

function toRegisteredView(
  device: { id: string; statusCode: string },
  input: RegisterDeviceInput,
  unitExpense: number,
  landedCost: string,
): RegisteredDeviceView {
  return {
    id: device.id,
    imei: input.imei,
    imei2: input.imei2 ?? null,
    modelId: input.modelId,
    acquisitionCost: new Prisma.Decimal(input.acquisitionCost).toFixed(2),
    unitExpense: new Prisma.Decimal(unitExpense).toFixed(2),
    landedCost,
    targetPrice:
      input.targetPrice != null
        ? new Prisma.Decimal(input.targetPrice).toFixed(2)
        : null,
    statusCode: device.statusCode,
  };
}

function toShipmentView(
  row: ShipmentRow,
  unitExpenseTotal: string,
): ShipmentView {
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
    unitExpenseTotal,
  };
}
