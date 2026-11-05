import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { toNumber } from '../common/lib/to-number.js';
import type { Prisma } from '../generated/client/client.js';
import { StoresService } from '../stores/stores.service.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { LedgerQueryDto } from './dto/ledger-query.dto.js';
import { TransferDto } from './dto/transfer.dto.js';
import { LedgerRepository } from './ledger.repository.js';
import { signedManualAmount } from './lib/signed-amount.js';
import type { BalanceSummary, LedgerPost } from './types/ledger.types.js';

@Injectable()
export class LedgerService {
  constructor(
    private readonly repo: LedgerRepository,
    private readonly stores: StoresService,
  ) {}

  /** One number per account plus the total — all summed from the rows. */
  async getBalances(): Promise<BalanceSummary> {
    const storeId = await this.stores.currentStoreId();
    const [accounts, sums] = await Promise.all([
      this.repo.listAccounts(),
      this.repo.sumByAccount(storeId),
    ]);
    const byCode = new Map(
      sums.map((s) => [s.accountCode, toNumber(s._sum.amount)]),
    );
    const rows = accounts.map((a) => ({
      accountCode: a.code,
      label: a.label,
      balance: byCode.get(a.code) ?? 0,
    }));
    return {
      accounts: rows,
      total: rows.reduce((sum, r) => sum + r.balance, 0),
    };
  }

  /** History, newest first, paginated and filterable (expenses conventions). */
  async list(query: LedgerQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const { items, total } = await this.repo.findMany({
      storeId: await this.stores.currentStoreId(),
      accountCode: query.accountCode,
      typeCode: query.typeCode,
      from: parseDate(query.from),
      to: parseDate(query.to),
      sort: query.sort ?? 'occurredAt',
      dir: query.dir ?? 'desc',
      page,
      pageSize,
    });
    return { items, total, page, pageSize };
  }

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
    return this.post({
      storeId,
      accountCode: dto.accountCode,
      typeCode: dto.typeCode,
      amount,
      occurredAt: parseDate(dto.occurredAt),
      note: dto.note,
      createdById,
    });
  }

  /**
   * Append one already-signed row. The single write primitive: 2a's manual
   * entries use it, and 2b's automatic posters call it with the active `tx` so
   * a sale (or refund, expense, ...) and its ledger row commit atomically.
   * Callers build a `LedgerPost`; no module ever touches LedgerRepository.
   */
  post(entry: LedgerPost, tx?: Prisma.TransactionClient) {
    if (entry.amount === 0) {
      throw new BadRequestException('amount cannot be zero');
    }
    return this.repo.create(entry, tx);
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

function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}
