import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { StoresService } from '../stores/stores.service.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { TransferDto } from './dto/transfer.dto.js';
import { LedgerRepository } from './ledger.repository.js';
import { LedgerService } from './ledger.service.js';
import { parseDate } from './lib/ledger-shaping.js';
import { signedManualAmount } from './lib/signed-amount.js';

/**
 * The owner's manual ledger writes: entries (opening, deposit, withdrawal,
 * correction) and transfers between accounts. Automatic posters (sales,
 * expenses, ...) never come here; they call `LedgerService.post`.
 */
@Injectable()
export class LedgerWriteService {
  constructor(
    private readonly repo: LedgerRepository,
    private readonly stores: StoresService,
    private readonly ledger: LedgerService,
  ) {}

  async createEntry(createdById: string, dto: CreateLedgerEntryDto) {
    const storeId = await this.stores.currentStoreId();
    await this.requireAccount(dto.accountCode);
    const amount = signedManualAmount(dto.typeCode, dto.amount, dto.note);
    if (
      dto.typeCode === 'OPENING' &&
      (await this.repo.openingExists(storeId, dto.accountCode))
    ) {
      throw new ConflictException(
        `Account ${dto.accountCode} already has an opening balance`,
      );
    }
    try {
      return await this.ledger.post({
        storeId,
        accountCode: dto.accountCode,
        typeCode: dto.typeCode,
        amount,
        occurredAt: parseDate(dto.occurredAt),
        note: dto.note,
        createdById,
      });
    } catch (error) {
      // A racing second OPENING slips past the check above and trips the partial
      // unique index — turn that into a 409, not a 500.
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `Account ${dto.accountCode} already has an opening balance`,
        );
      }
      throw error;
    }
  }

  async transfer(createdById: string, dto: TransferDto) {
    if (dto.fromAccountCode === dto.toAccountCode) {
      throw new BadRequestException('A transfer needs two different accounts');
    }
    const storeId = await this.stores.currentStoreId();
    await Promise.all([
      this.requireAccount(dto.fromAccountCode),
      this.requireAccount(dto.toAccountCode),
    ]);
    const shared = {
      storeId,
      typeCode: 'TRANSFER',
      occurredAt: parseDate(dto.occurredAt),
      note: dto.note,
      transferId: randomUUID(),
      createdById,
    };
    return this.repo.createTransfer(
      { ...shared, accountCode: dto.fromAccountCode, amount: -dto.amount },
      { ...shared, accountCode: dto.toAccountCode, amount: dto.amount },
    );
  }

  private async requireAccount(code: string) {
    if (!(await this.repo.accountExists(code))) {
      throw new BadRequestException(`Unknown or inactive account ${code}`);
    }
  }
}
