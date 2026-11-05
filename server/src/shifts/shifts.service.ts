import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CloseShiftDto } from './dto/close-shift.dto.js';
import { ForceCloseShiftDto } from './dto/force-close-shift.dto.js';
import { OpenShiftDto } from './dto/open-shift.dto.js';
import {
  CASH_ACCOUNT,
  SHIFT_DIFFERENCE_TYPE,
  summariseShift,
} from './lib/shift-math.js';
import { ShiftsReadService } from './shifts-read.service.js';
import { ShiftsRepository, type ShiftRow } from './shifts.repository.js';
import type { ShiftReportView } from './types/shift.types.js';

/** The code clients watch for to offer "open a shift" (ADR 0036). */
export const NO_OPEN_SHIFT = 'NO_OPEN_SHIFT';

/** Shift writes and the "selling needs an open shift" gate (ADR 0036). */
@Injectable()
export class ShiftsService {
  constructor(
    private readonly repo: ShiftsRepository,
    private readonly read: ShiftsReadService,
    private readonly ledger: LedgerService,
    private readonly settings: SettingsService,
    private readonly stores: StoresService,
  ) {}

  /** Open my shift with the counted drawer cash. One open shift per cashier. */
  async open(
    caller: AuthenticatedUser,
    dto: OpenShiftDto,
  ): Promise<ShiftReportView> {
    const storeId = await this.stores.currentStoreId();
    if (await this.repo.findOpenByCashier(caller.id)) {
      throw new ConflictException('You already have an open shift');
    }
    try {
      const shift = await this.repo.open(
        storeId,
        caller.id,
        new Prisma.Decimal(dto.openingCount),
      );
      return this.read.buildReport(shift);
    } catch (error) {
      // A racing second open trips the partial unique index — 409, not 500.
      if (isUniqueViolation(error)) {
        throw new ConflictException('You already have an open shift');
      }
      throw error;
    }
  }

  /** Close my own open shift; answer with its report. */
  async close(
    caller: AuthenticatedUser,
    dto: CloseShiftDto,
  ): Promise<ShiftReportView> {
    const shift = await this.repo.findOpenByCashier(caller.id);
    if (!shift) throw new NotFoundException('You have no open shift to close');
    return this.finishClose(caller.id, shift, dto.closingCount, dto.note);
  }

  /** Close another cashier's forgotten shift (shift.manage); note is required. */
  async forceClose(
    caller: AuthenticatedUser,
    id: string,
    dto: ForceCloseShiftDto,
  ): Promise<ShiftReportView> {
    const shift = await this.repo.findById(id);
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);
    if (shift.closedAt) throw new ConflictException('Shift is already closed');
    return this.finishClose(caller.id, shift, dto.closingCount, dto.note);
  }

  /**
   * Close the shift and, when the drawer did not match, post one
   * SHIFT_DIFFERENCE cash row (positive = counted more than expected) linked to
   * the shift, atomically. The movement rows are read first; a sale committing
   * in the tiny window before close lands in the shift's own report next read.
   */
  private async finishClose(
    closedById: string,
    shift: ShiftRow,
    closingCountNum: number,
    note: string | undefined,
  ): Promise<ShiftReportView> {
    const closedAt = new Date();
    const closingCount = new Prisma.Decimal(closingCountNum);
    const rows = await this.ledger.shiftRows(
      shift.cashierId,
      shift.openedAt,
      closedAt,
    );
    const { differenceAmount } = summariseShift(
      shift.openingCount,
      closingCount,
      rows,
    );
    const storeId = shift.storeId;

    await this.repo.runInTransaction(async (tx) => {
      const { count } = await this.repo.close(
        tx,
        shift.id,
        closedAt,
        closingCount,
        note,
      );
      if (count === 0) throw new ConflictException('Shift is already closed');
      if (differenceAmount && differenceAmount !== 0) {
        await this.postDifference(tx, {
          storeId,
          shiftId: shift.id,
          amount: differenceAmount,
          occurredAt: closedAt,
          createdById: closedById,
        });
      }
    });
    const closed = await this.repo.findById(shift.id);
    return this.read.buildReport(closed!);
  }

  private postDifference(
    tx: PrismaTx,
    entry: {
      storeId: string;
      shiftId: string;
      amount: number;
      occurredAt: Date;
      createdById: string;
    },
  ): Promise<unknown> {
    return this.ledger.post(
      {
        storeId: entry.storeId,
        accountCode: CASH_ACCOUNT,
        typeCode: SHIFT_DIFFERENCE_TYPE,
        amount: entry.amount,
        occurredAt: entry.occurredAt,
        shiftId: entry.shiftId,
        createdById: entry.createdById,
      },
      tx,
    );
  }

  /**
   * Selling gate: when shifts are on, a sale/credit without an open shift is
   * rejected with a recognisable code. Offline replays are trusted (the sale
   * already happened at the counter) and never rejected.
   */
  async assertCanSell(
    caller: AuthenticatedUser,
    opts?: { fromSync?: boolean },
  ): Promise<void> {
    if (opts?.fromSync) return;
    const { shiftsEnabled } = await this.settings.get();
    if (!shiftsEnabled) return;
    if (!(await this.repo.findOpenByCashier(caller.id))) {
      throw new ConflictException({
        code: NO_OPEN_SHIFT,
        message: 'Open a shift before selling',
      });
    }
  }
}
