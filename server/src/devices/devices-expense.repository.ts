import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toDeviceView } from './lib/device-view.mapper.js';
import { computeLandedCost } from './lib/landed-cost.js';
import { DeviceView } from './types/device.types.js';

type Tx = Prisma.TransactionClient;

interface CostState {
  acquisitionCost: Prisma.Decimal;
  customsFee: Prisma.Decimal;
  unitExpense: Prisma.Decimal;
  shipmentId: string;
  shipment: { storeId: string; paymentAccountCode: string };
}

/**
 * Write-side access for a phone's own cost fields (expense, customs fee).
 * Recomputes landed cost and posts the **difference** (ADR 0026/0027) in one
 * transaction so the device row and its ledger row commit atomically; a zero
 * difference posts nothing. A sold phone's `landedCostSnapshot` lives on its
 * sale row and is never touched here.
 */
@Injectable()
export class DevicesExpenseRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async setExpense(
    id: string,
    unitExpense: number,
    unitExpenseNote: string | null | undefined,
    userId: string,
  ): Promise<DeviceView> {
    return this.prisma.$transaction(async (tx) => {
      const before = await this.loadState(tx, id);
      const landedCost = computeLandedCost(
        before.acquisitionCost.toNumber(),
        before.customsFee.toNumber(),
        unitExpense,
      );
      const row = await tx.device.update({
        where: { id },
        data: {
          unitExpense,
          unitExpenseNote:
            unitExpenseNote === undefined ? undefined : unitExpenseNote,
          landedCost,
        },
      });
      const diff = new Prisma.Decimal(unitExpense).minus(before.unitExpense);
      await this.postDiff(tx, before, id, diff, 'DEVICE_EXPENSE', userId);
      return toDeviceView(row);
    });
  }

  async setCustomsFee(
    id: string,
    customsFee: number,
    userId: string,
  ): Promise<DeviceView> {
    return this.prisma.$transaction(async (tx) => {
      const before = await this.loadState(tx, id);
      const landedCost = computeLandedCost(
        before.acquisitionCost.toNumber(),
        customsFee,
        before.unitExpense.toNumber(),
      );
      const row = await tx.device.update({
        where: { id },
        data: { customsFee, landedCost },
      });
      const diff = new Prisma.Decimal(customsFee).minus(before.customsFee);
      await this.postDiff(tx, before, id, diff, 'CUSTOMS', userId);
      return toDeviceView(row);
    });
  }

  private loadState(tx: Tx, id: string): Promise<CostState> {
    return tx.device.findUniqueOrThrow({
      where: { id },
      select: {
        acquisitionCost: true,
        customsFee: true,
        unitExpense: true,
        shipmentId: true,
        shipment: { select: { storeId: true, paymentAccountCode: true } },
      },
    });
  }

  /** Posts the signed difference (more cost = money out) under `typeCode`. */
  private async postDiff(
    tx: Tx,
    before: CostState,
    deviceId: string,
    diff: Prisma.Decimal,
    typeCode: 'DEVICE_EXPENSE' | 'CUSTOMS',
    userId: string,
  ): Promise<void> {
    if (diff.isZero()) return;
    await this.ledger.post(
      {
        storeId: before.shipment.storeId,
        accountCode: before.shipment.paymentAccountCode,
        typeCode,
        amount: diff.negated(),
        deviceId,
        shipmentId: before.shipmentId,
        createdById: userId,
      },
      tx,
    );
  }
}
