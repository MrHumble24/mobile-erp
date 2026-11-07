import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { computeLandedCost } from '../devices/lib/landed-cost.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { deviceData, toRegisteredView } from './lib/shipment-intake.mapper.js';
import { toShipmentView } from './shipments.repository.js';
import {
  RegisteredDeviceView,
  RegisterDeviceInput,
  ShipmentInput,
  ShipmentView,
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

  async findExistingImeis(imeis: string[]): Promise<string[]> {
    if (imeis.length === 0) return [];
    const rows = await this.prisma.device.findMany({
      where: {
        OR: [{ imei: { in: imeis } }, { imei2: { in: imeis } }],
      },
      select: { imei: true, imei2: true },
    });
    const found = new Set<string>();
    for (const r of rows) {
      if (r.imei) found.add(r.imei);
      if (r.imei2) found.add(r.imei2);
    }
    return [...found];
  }

  async addDevices(
    shipmentId: string,
    inputs: RegisterDeviceInput[],
    userId: string,
    storeId: string,
    existingTx?: Tx,
  ): Promise<RegisteredDeviceView[]> {
    const run = async (tx: Tx) => {
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
    };
    return existingTx ? run(existingTx) : this.prisma.$transaction(run);
  }

  async createShipmentWithDevices(
    shipmentInput: ShipmentInput,
    deviceInputs: RegisterDeviceInput[],
    userId: string,
  ): Promise<{ shipment: ShipmentView; devices: RegisteredDeviceView[] }> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.shipment.create({
        data: {
          storeId: shipmentInput.storeId,
          supplierId: shipmentInput.supplierId,
          shipmentDate: shipmentInput.shipmentDate,
          expectedCount: shipmentInput.expectedCount,
          paymentAccountCode: shipmentInput.paymentAccountCode,
          exchangeRate: shipmentInput.exchangeRate,
          notes: shipmentInput.notes ?? null,
          createdById: shipmentInput.createdById,
        },
        include: { _count: { select: { devices: true } } },
      });
      const devices = await this.addDevices(
        row.id,
        deviceInputs,
        userId,
        shipmentInput.storeId,
        tx,
      );
      return {
        shipment: toShipmentView(row, undefined),
        devices,
      };
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
