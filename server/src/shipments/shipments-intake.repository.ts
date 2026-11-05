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
} from './types/shipment.types.js';

type Tx = Prisma.TransactionClient;
type Account = { storeId: string; paymentAccountCode: string };

/**
 * Batched IMEI intake into a shipment. Each device's landed cost is
 * `acquisitionCost + customsFee + unitExpense` (ADR 0026/0027); PURCHASE,
 * CUSTOMS and DEVICE_EXPENSE rows post from the shipment account in one
 * transaction (ADR 0025). Injects the ledger; the plain CRUD repository does not.
 */
@Injectable()
export class ShipmentsIntakeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async addDevices(
    shipmentId: string,
    inputs: RegisterDeviceInput[],
    userId: string,
    storeId: string,
  ): Promise<RegisteredDeviceView[]> {
    return this.prisma.$transaction(async (tx) => {
      await this.assertIdentifiersFree(tx, inputs);
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
    tx: Tx,
    shipmentId: string,
    storeId: string,
    shipment: Account,
    input: RegisterDeviceInput,
    userId: string,
  ): Promise<RegisteredDeviceView> {
    const acquisitionCost = input.acquisitionCost;
    const unitExpense = input.unitExpense ?? 0;
    const customsFee = input.customsFee ?? 0;
    const landedCost = computeLandedCost(
      acquisitionCost,
      customsFee,
      unitExpense,
    );
    const device = await tx.device.create({
      data: deviceData(input, storeId, shipmentId, landedCost, userId),
      select: { id: true, statusCode: true },
    });
    await this.postIntake(
      tx,
      shipment,
      {
        deviceId: device.id,
        shipmentId,
        acquisitionCost,
        customsFee,
        unitExpense,
      },
      userId,
    );
    return toRegisteredView(device, input, customsFee, unitExpense, landedCost);
  }

  /**
   * Rejects a serial that collides within the batch or against an existing
   * unit. Serials are already normalised (upper-cased) by the service.
   */
  private async assertSerialsFree(
    tx: Tx,
    inputs: RegisterDeviceInput[],
  ): Promise<void> {
    const serials = inputs
      .map((d) => d.serialNumber)
      .filter((s): s is string => !!s);
    if (serials.length === 0) return;
    if (new Set(serials).size !== serials.length) {
      throw new ConflictException('Duplicate serial number within the batch');
    }
    const clash = await tx.device.findFirst({
      where: { serialNumber: { in: serials } },
      select: { serialNumber: true },
    });
    if (clash) {
      throw new ConflictException(
        'A unit with this serial number already exists',
      );
    }
  }

  /**
   * One ledger row per cost that left the store at intake, all from the
   * shipment's account: PURCHASE (supplier price), CUSTOMS (stamped fee) and
   * DEVICE_EXPENSE (per-phone expense). Each posts only when > 0.
   */
  private async postIntake(
    tx: Tx,
    shipment: Account,
    costs: {
      deviceId: string;
      shipmentId: string;
      acquisitionCost: number;
      customsFee: number;
      unitExpense: number;
    },
    userId: string,
  ): Promise<void> {
    const lines: [string, number][] = [
      ['PURCHASE', costs.acquisitionCost],
      ['CUSTOMS', costs.customsFee],
      ['DEVICE_EXPENSE', costs.unitExpense],
    ];
    for (const [typeCode, amount] of lines) {
      const value = new Prisma.Decimal(amount);
      if (!value.gt(0)) continue;
      await this.ledger.post(
        {
          storeId: shipment.storeId,
          accountCode: shipment.paymentAccountCode,
          typeCode,
          amount: value.negated(),
          deviceId: costs.deviceId,
          shipmentId: costs.shipmentId,
          createdById: userId,
        },
        tx,
      );
    }
  }

  /**
   * Rejects an intake whose IMEIs collide — within the batch, between a unit's
   * own imei/imei2, or against either IMEI column of an existing device. The
   * single-column unique indexes cannot see cross-column clashes on their own.
   */
  private async assertIdentifiersFree(
    tx: Tx,
    inputs: RegisterDeviceInput[],
  ): Promise<void> {
    const values: string[] = [];
    for (const d of inputs) {
      if (d.imei2 && d.imei2 === d.imei) {
        throw new BadRequestException(
          `imei2 must differ from imei (${d.imei})`,
        );
      }
      if (d.imei) values.push(d.imei);
      if (d.imei2) values.push(d.imei2);
    }
    if (values.length > 0) {
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
    await this.assertSerialsFree(tx, inputs);
  }
}

function deviceData(
  input: RegisterDeviceInput,
  storeId: string,
  shipmentId: string,
  landedCost: string,
  userId: string,
): Prisma.DeviceUncheckedCreateInput {
  return {
    imei: input.imei ?? null,
    imei2: input.imei2 ?? null,
    serialNumber: input.serialNumber ?? null,
    storeId,
    shipmentId,
    modelId: input.modelId,
    specs: input.specs as Prisma.InputJsonValue,
    acquisitionCost: input.acquisitionCost,
    customsFee: input.customsFee ?? 0,
    unitExpense: input.unitExpense ?? 0,
    unitExpenseNote: input.unitExpenseNote ?? null,
    landedCost,
    targetPrice: input.targetPrice ?? null,
    statusCode: 'IN_STOCK',
    statusHistory: {
      create: { toStatusCode: 'IN_STOCK', changedById: userId },
    },
  };
}

function toRegisteredView(
  device: { id: string; statusCode: string },
  input: RegisterDeviceInput,
  customsFee: number,
  unitExpense: number,
  landedCost: string,
): RegisteredDeviceView {
  return {
    id: device.id,
    imei: input.imei ?? null,
    imei2: input.imei2 ?? null,
    serialNumber: input.serialNumber ?? null,
    modelId: input.modelId,
    kindCode: input.kindCode,
    acquisitionCost: new Prisma.Decimal(input.acquisitionCost).toFixed(2),
    customsFee: new Prisma.Decimal(customsFee).toFixed(2),
    unitExpense: new Prisma.Decimal(unitExpense).toFixed(2),
    landedCost,
    targetPrice:
      input.targetPrice != null
        ? new Prisma.Decimal(input.targetPrice).toFixed(2)
        : null,
    statusCode: device.statusCode,
  };
}
