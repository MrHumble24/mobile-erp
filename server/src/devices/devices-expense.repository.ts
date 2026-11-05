import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { computeLandedCost } from './lib/landed-cost.js';
import { toDeviceView } from './lib/device-view.mapper.js';
import { DeviceView } from './types/device.types.js';

/**
 * Write-side access for a phone's own expense. Recomputes landed cost and posts
 * the DEVICE_EXPENSE **difference** (ADR 0026) in one transaction so the device
 * row and its ledger row commit atomically. A sold phone's `landedCostSnapshot`
 * lives on its sale row and is never touched here.
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
      const before = await tx.device.findUniqueOrThrow({
        where: { id },
        select: {
          acquisitionCost: true,
          unitExpense: true,
          shipmentId: true,
          shipment: { select: { storeId: true, paymentAccountCode: true } },
        },
      });
      // customsFee is added by commit 3; it is 0 here.
      const landedCost = computeLandedCost(
        before.acquisitionCost.toNumber(),
        0,
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
      if (!diff.isZero()) {
        await this.ledger.post(
          {
            storeId: before.shipment.storeId,
            accountCode: before.shipment.paymentAccountCode,
            typeCode: 'DEVICE_EXPENSE',
            amount: diff.negated(), // more expense = money out (negative)
            deviceId: id,
            shipmentId: before.shipmentId,
            createdById: userId,
          },
          tx,
        );
      }
      return toDeviceView(row);
    });
  }
}
