import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerRepairReadService } from '../ledger/ledger-repair-read.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StoresService } from '../stores/stores.service.js';
import { RepairMoneyDto } from './dto/repair-money.dto.js';
import { commitMutation } from './lib/repair-mutation.js';
import { isTerminal } from './lib/repair-status.js';
import { RepairIdempotency } from './repair-idempotency.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';
import { REPAIR_TERMINAL } from './repairs.service.js';
import type { RepairRaw } from './repairs.repository.js';
import type { RepairView } from './types/repair.types.js';

const ZERO = new Prisma.Decimal(0);

/** The code clients watch for when paying an outside master on an own-master ticket. */
export const REPAIR_NOT_OUTSIDE = 'REPAIR_NOT_OUTSIDE';

/** Repair money at the till: customer payments, refunds, outside-master payments. */
@Injectable()
export class RepairsMoneyService {
  constructor(
    private readonly read: RepairsReadService,
    private readonly writes: RepairsWriteRepository,
    private readonly ledger: LedgerService,
    private readonly shifts: ShiftsService,
    private readonly stores: StoresService,
    private readonly ledgerRepair: LedgerRepairReadService,
    private readonly idem: RepairIdempotency,
  ) {}

  /** A customer payment (deposit or hand-over). Capped at the amount still owed. */
  async addPayment(
    caller: AuthenticatedUser,
    id: string,
    dto: RepairMoneyDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const replayed = await this.idem.replay(caller, dto.clientMutationId);
    if (replayed) return replayed;
    const raw = await this.read.require(id);
    this.assertOpen(raw);
    await this.requireActiveAccount(dto.accountCode);
    await this.shifts.assertCanSell(caller);
    const amount = new Prisma.Decimal(dto.amount);
    const owed = raw.agreedPrice.minus(paidOf(raw));
    if (amount.greaterThan(owed)) {
      throw new BadRequestException(
        `Payment ${amount.toFixed(2)} exceeds the ${owed.toFixed(2)} still owed`,
      );
    }
    return commitMutation(
      this.idem,
      this.read,
      caller,
      dto.clientMutationId,
      id,
      () => this.postPayment(caller, id, dto, amount, raw.version, 'payment'),
    );
  }

  /** Refund money taken (e.g. on cancel). Capped at net paid, as ADR 0028. */
  async refund(
    caller: AuthenticatedUser,
    id: string,
    dto: RepairMoneyDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const replayed = await this.idem.replay(caller, dto.clientMutationId);
    if (replayed) return replayed;
    const raw = await this.read.require(id);
    this.assertOpen(raw);
    await this.requireActiveAccount(dto.accountCode);
    await this.shifts.assertCanSell(caller);
    const paid = paidOf(raw);
    if (paid.lessThanOrEqualTo(ZERO)) {
      throw new BadRequestException('Nothing has been paid on this ticket');
    }
    const requested = new Prisma.Decimal(dto.amount);
    const refund = requested.greaterThan(paid) ? paid : requested;
    return commitMutation(
      this.idem,
      this.read,
      caller,
      dto.clientMutationId,
      id,
      () =>
        this.postPayment(
          caller,
          id,
          dto,
          refund.negated(),
          raw.version,
          'refund',
        ),
    );
  }

  /** Pay the outside master: money out, linked to the ticket. No business row. */
  async outsidePayment(
    caller: AuthenticatedUser,
    id: string,
    dto: RepairMoneyDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const replayed = await this.idem.replay(caller, dto.clientMutationId);
    if (replayed) return replayed;
    const raw = await this.read.require(id);
    this.assertOpen(raw);
    if (!raw.outsideMasterName) {
      throw new ConflictException({
        code: REPAIR_NOT_OUTSIDE,
        message: 'This ticket is not an outside-master repair',
      });
    }
    await this.requireActiveAccount(dto.accountCode);
    await this.shifts.assertCanSell(caller);
    const amount = new Prisma.Decimal(dto.amount);
    await this.assertWithinOutsideCap(raw, id, amount);
    const storeId = await this.stores.currentStoreId();
    return commitMutation(
      this.idem,
      this.read,
      caller,
      dto.clientMutationId,
      id,
      () =>
        this.writes.transaction(async (tx) => {
          await this.writes.bumpVersion(tx, id, raw.version);
          await this.ledger.post(
            {
              storeId,
              accountCode: dto.accountCode,
              typeCode: 'REPAIR_OUTSIDE',
              amount: amount.negated(),
              occurredAt: new Date(),
              repairId: id,
              createdById: caller.id,
            },
            tx,
          );
          await this.idem.record(tx, dto.clientMutationId, id, 'outside');
        }),
    );
  }

  /** Cap an outside payment at max(outsideCost − already paid outside, 0). */
  private async assertWithinOutsideCap(
    raw: RepairRaw,
    id: string,
    amount: Prisma.Decimal,
  ): Promise<void> {
    if (!raw.outsideCost) return;
    const alreadyPaid =
      (await this.ledgerRepair.outsidePaid([id])).get(id) ?? ZERO;
    const remaining = raw.outsideCost.minus(alreadyPaid);
    const cap = remaining.greaterThan(ZERO) ? remaining : ZERO;
    if (amount.greaterThan(cap)) {
      throw new BadRequestException(
        `Outside payment ${amount.toFixed(2)} exceeds the ${cap.toFixed(2)} still owed to the outside master`,
      );
    }
  }

  private assertOpen(raw: RepairRaw): void {
    if (isTerminal(raw.statusCode)) {
      throw new ConflictException({
        code: REPAIR_TERMINAL,
        message: 'A given-back or cancelled ticket takes no more payments',
      });
    }
  }

  /** One repair payment row + its single REPAIR_PAYMENT ledger row, atomically. */
  private async postPayment(
    caller: AuthenticatedUser,
    repairId: string,
    dto: RepairMoneyDto,
    amount: Prisma.Decimal,
    version: number,
    kind: string,
  ): Promise<void> {
    const storeId = await this.stores.currentStoreId();
    const occurredAt = new Date();
    await this.writes.transaction(async (tx: PrismaTx) => {
      const paymentId = await this.writes.createPayment(
        tx,
        {
          repairId,
          accountCode: dto.accountCode,
          amount,
          receivedById: caller.id,
          occurredAt,
        },
        version,
      );
      await this.ledger.post(
        {
          storeId,
          accountCode: dto.accountCode,
          typeCode: 'REPAIR_PAYMENT',
          amount,
          occurredAt,
          repairPaymentId: paymentId,
          createdById: caller.id,
        },
        tx,
      );
      await this.idem.record(tx, dto.clientMutationId, repairId, kind);
    });
  }

  private async requireActiveAccount(code: string): Promise<void> {
    const accounts = await this.ledger.activeAccountCodes();
    if (!accounts.includes(code)) {
      throw new BadRequestException(`Unknown or inactive account ${code}`);
    }
  }
}

function paidOf(raw: RepairRaw): Prisma.Decimal {
  return raw.payments.reduce((s, p) => s.plus(p.amount), ZERO);
}
