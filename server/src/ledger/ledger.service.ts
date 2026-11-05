import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { Prisma } from '../generated/client/client.js';
import { StoresService } from '../stores/stores.service.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { LedgerQueryDto } from './dto/ledger-query.dto.js';
import { TransferDto } from './dto/transfer.dto.js';
import { LedgerRepository } from './ledger.repository.js';
import { hideCostAmount, parseDate, sumMap } from './lib/ledger-shaping.js';
import { signedManualAmount } from './lib/signed-amount.js';
import { currentAccount, foldSourceNets } from './lib/source-nets.js';
import { buildMultiStoreBalances } from './lib/store-balances.js';
import {
  type AccountNet,
  type BalanceSummary,
  type DigestBalances,
  type LedgerPost,
  type LedgerSourceField,
  type ShiftRowNet,
} from './types/ledger.types.js';

@Injectable()
export class LedgerService {
  constructor(
    private readonly repo: LedgerRepository,
    private readonly stores: StoresService,
  ) {}

  /**
   * One balance per account plus the total, summed from the rows in exact
   * decimal arithmetic (never float) and returned as 2-dp strings.
   */
  async getBalances(): Promise<BalanceSummary> {
    const storeIds = await this.stores.currentStoreIds();
    const accounts = await this.repo.listAccounts();

    if (storeIds.length > 1) {
      const allStores = await this.stores.list(false);
      const storeMap = new Map(allStores.map((s) => [s.id, s.name]));
      const sumsByStore = new Map<string, Map<string, Prisma.Decimal>>();
      await Promise.all(
        storeIds.map(async (id) => {
          const sums = await this.repo.sumByAccount(id);
          sumsByStore.set(id, sumMap(sums));
        }),
      );
      return buildMultiStoreBalances(accounts, storeIds, storeMap, sumsByStore);
    }

    const storeId = storeIds[0] ?? (await this.stores.currentStoreId());
    const sums = await this.repo.sumByAccount(storeId);
    const byCode = sumMap(sums);
    let total = new Prisma.Decimal(0);
    const rows = accounts.map((a) => {
      const balance = byCode.get(a.code) ?? new Prisma.Decimal(0);
      total = total.plus(balance);
      return {
        accountCode: a.code,
        label: a.label,
        balance: balance.toFixed(2),
      };
    });
    return { accounts: rows, total: total.toFixed(2) };
  }

  /**
   * Per-account balance at the start of `dayStart` (opening) and now (closing),
   * both summed from the rows — for the Telegram closing digest (2c). The
   * Telegram module never touches ledger tables itself.
   */
  async digestBalances(dayStart: Date): Promise<DigestBalances> {
    const storeId = await this.stores.currentStoreId();
    const [accounts, opening, closing] = await Promise.all([
      this.repo.listAccounts(),
      this.repo.sumByAccount(storeId, dayStart),
      this.repo.sumByAccount(storeId),
    ]);
    const openingBy = sumMap(opening);
    const closingBy = sumMap(closing);
    let openingTotal = new Prisma.Decimal(0);
    let closingTotal = new Prisma.Decimal(0);
    const rows = accounts.map((a) => {
      const o = openingBy.get(a.code) ?? new Prisma.Decimal(0);
      const c = closingBy.get(a.code) ?? new Prisma.Decimal(0);
      openingTotal = openingTotal.plus(o);
      closingTotal = closingTotal.plus(c);
      return {
        accountCode: a.code,
        label: a.label,
        opening: o.toFixed(2),
        closing: c.toFixed(2),
      };
    });
    return {
      accounts: rows,
      openingTotal: openingTotal.toFixed(2),
      closingTotal: closingTotal.toFixed(2),
    };
  }

  /** Active account codes, for validating caller-supplied payment accounts. */
  async activeAccountCodes(): Promise<string[]> {
    const accounts = await this.repo.listAccounts();
    return accounts.map((a) => a.code);
  }

  /**
   * Active accounts (code + label, in sortOrder, no amounts) for the checkout /
   * expense / payment pickers — readable by any signed-in user, no permission.
   */
  async listAccounts(): Promise<{ accountCode: string; label: string }[]> {
    const accounts = await this.repo.listAccounts();
    return accounts.map((a) => ({ accountCode: a.code, label: a.label }));
  }

  /** Per-account SALE nets for each sale (positive = money taken in). */
  salePayments(saleIds: string[]): Promise<Map<string, AccountNet[]>> {
    return this.sourceNets('saleId', ['SALE'], saleIds);
  }

  /** The account each partner payment landed in (one row), or none. */
  async partnerPaymentAccounts(ids: string[]): Promise<Map<string, string>> {
    const nets = await this.sourceNets(
      'partnerPaymentId',
      ['PARTNER_PAYMENT'],
      ids,
    );
    return this.toCurrentAccounts(nets);
  }

  /** The account each expense's money currently sits against, or none. */
  async expenseAccounts(ids: string[]): Promise<Map<string, string>> {
    const nets = await this.sourceNets('expenseId', ['EXPENSE'], ids);
    return this.toCurrentAccounts(nets);
  }

  /** The account each customer purchase was paid from (ADR 0039); a trade-in has none. */
  async customerPurchaseAccounts(ids: string[]): Promise<Map<string, string>> {
    const nets = await this.sourceNets(
      'customerPurchaseId',
      ['CUSTOMER_PURCHASE'],
      ids,
    );
    return this.toCurrentAccounts(nets);
  }

  /**
   * Every cash row the cashier posted in a shift's window (ADR 0036) — the raw
   * input the shift report groups and sums. The SHIFT_DIFFERENCE correction is
   * returned too; the pure summary drops it, never treating it as movement.
   */
  shiftRows(userId: string, from: Date, to: Date): Promise<ShiftRowNet[]> {
    return this.stores
      .currentStoreId()
      .then((storeId) =>
        this.repo.rowsForUserWindow(storeId, userId, from, to),
      );
  }

  /** Net SHIFT_DIFFERENCE amount per shift, for the shifts list (ADR 0036). */
  async shiftDifferences(
    shiftIds: string[],
  ): Promise<Map<string, Prisma.Decimal>> {
    const rows = await this.repo.sumDifferenceByShift(shiftIds);
    const map = new Map<string, Prisma.Decimal>();
    for (const r of rows) {
      if (r.shiftId) map.set(r.shiftId, r._sum.amount ?? new Prisma.Decimal(0));
    }
    return map;
  }

  private async sourceNets(
    field: LedgerSourceField,
    typeCodes: string[],
    ids: string[],
  ): Promise<Map<string, AccountNet[]>> {
    const rows = await this.repo.groupBySource(field, typeCodes, ids);
    return foldSourceNets(field, rows);
  }

  private toCurrentAccounts(
    nets: Map<string, AccountNet[]>,
  ): Map<string, string> {
    const out = new Map<string, string>();
    for (const [id, list] of nets) {
      const account = currentAccount(list);
      if (account) out.set(id, account);
    }
    return out;
  }

  /**
   * History, newest first, paginated and filterable (expenses conventions).
   * A caller without the cost permission gets `amount: null` on cost-type rows
   * (PURCHASE/OVERHEAD/DEVICE_EXPENSE/CUSTOMS) — their amount is a device cost
   * the interceptor cannot redact by field name. The row is otherwise intact.
   */
  async list(query: LedgerQueryDto, canViewCost = true) {
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
    const shaped = canViewCost ? items : items.map(hideCostAmount);
    return { items: shaped, total, page, pageSize };
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
    try {
      return await this.post({
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

  /**
   * Append one already-signed row. The single write primitive: 2a's manual
   * entries use it, and 2b's automatic posters call it with the active `tx` so
   * a sale (or refund, expense, ...) and its ledger row commit atomically.
   * Callers build a `LedgerPost`; no module ever touches LedgerRepository.
   */
  post(entry: LedgerPost, tx?: Prisma.TransactionClient) {
    if (new Prisma.Decimal(entry.amount).isZero()) {
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
