import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { SettingsService } from '../settings/settings.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CreditsRepository, type CreditRaw } from './credits.repository.js';
import { ListCreditsQueryDto } from './dto/list-credits.query.dto.js';
import type { CreditStanding } from './lib/credit-math.js';
import { standingOf, toCreditView, toListItem } from './lib/credit-mapper.js';
import type {
  CreditContract,
  CreditListItem,
  CreditReport,
  CreditView,
  CustomerCreditSummary,
  OverdueCredit,
} from './types/credit.types.js';

const ZERO = new Prisma.Decimal(0);
const CONTRACT_TERMS =
  'Interest-free (Islamic) instalment sale. The agreed price is fixed and ' +
  'never increases. No interest, late fee or penalty is charged for paying late.';

/** Read model for customer credit: all derived with `credit-math.ts`. */
@Injectable()
export class CreditsReadService {
  constructor(
    private readonly repo: CreditsRepository,
    private readonly stores: StoresService,
    private readonly settings: SettingsService,
  ) {}

  async get(id: string): Promise<CreditView> {
    const raw = await this.require(id);
    return toCreditView(raw, standingOf(raw, new Date()));
  }

  /**
   * The raw rows plus computed standing — for the write service's gates. Pass
   * the write `tx` to read inside a locked transaction (ADR 0028), so two
   * concurrent payments see each other's rows.
   */
  async standing(
    id: string,
    tx?: PrismaTx,
  ): Promise<{ raw: CreditRaw; standing: CreditStanding }> {
    const raw = await this.require(id, tx);
    return { raw, standing: standingOf(raw, new Date()) };
  }

  async list(query: ListCreditsQueryDto): Promise<CreditListItem[]> {
    const now = new Date();
    const storeIds = await this.stores.currentStoreIds();
    const rows = await this.repo.listRaw(storeIds, query.customerId);
    return rows
      .map((raw) => ({ raw, standing: standingOf(raw, now) }))
      .filter(({ standing }) => matchesStatus(standing, query.status))
      .map(({ raw, standing }) => toListItem(raw, standing));
  }

  /** A customer's outstanding, overdue and effective credit limit. */
  async customerSummary(customerId: string): Promise<CustomerCreditSummary> {
    const now = new Date();
    const storeIds = await this.stores.currentStoreIds();
    const [rows, customer, settings] = await Promise.all([
      this.repo.listRaw(storeIds, customerId),
      this.repo.customerForCredit(customerId),
      this.settings.get(),
    ]);
    let outstanding = ZERO;
    let overdue = ZERO;
    for (const raw of rows) {
      const s = standingOf(raw, now);
      if (s.outstanding.greaterThan(ZERO))
        outstanding = outstanding.plus(s.outstanding);
      overdue = overdue.plus(s.overdueAmount);
    }
    const limit = customer?.creditLimit ?? settings.defaultCreditLimit ?? null;
    return {
      outstanding: outstanding.toFixed(2),
      overdueAmount: overdue.toFixed(2),
      effectiveLimit: limit === null ? null : limit.toFixed(2),
    };
  }

  async report(): Promise<CreditReport> {
    const now = new Date();
    const rows = await this.repo.listRaw();
    const byCustomer = new Map<
      string,
      {
        name: string;
        phone: string | null;
        outstanding: Prisma.Decimal;
        overdue: Prisma.Decimal;
      }
    >();
    for (const raw of rows) {
      const s = standingOf(raw, now);
      const positive = s.outstanding.greaterThan(ZERO) ? s.outstanding : ZERO;
      const entry = byCustomer.get(raw.customer.id) ?? {
        name: raw.customer.name,
        phone: raw.customer.phone,
        outstanding: ZERO,
        overdue: ZERO,
      };
      entry.outstanding = entry.outstanding.plus(positive);
      entry.overdue = entry.overdue.plus(s.overdueAmount);
      byCustomer.set(raw.customer.id, entry);
    }
    let totalOutstanding = ZERO;
    let totalOverdue = ZERO;
    const customers = [...byCustomer.entries()]
      .filter(
        ([, e]) =>
          e.outstanding.greaterThan(ZERO) || e.overdue.greaterThan(ZERO),
      )
      .map(([customerId, e]) => {
        totalOutstanding = totalOutstanding.plus(e.outstanding);
        totalOverdue = totalOverdue.plus(e.overdue);
        return {
          customerId,
          name: e.name,
          phone: e.phone,
          outstanding: e.outstanding.toFixed(2),
          overdueAmount: e.overdue.toFixed(2),
        };
      });
    return {
      totalOutstanding: totalOutstanding.toFixed(2),
      totalOverdue: totalOverdue.toFixed(2),
      customers,
    };
  }

  /** Overdue credits for the Telegram reminder (same once-a-day rule as partners). */
  async overdue(): Promise<OverdueCredit[]> {
    const now = new Date();
    const rows = await this.repo.listRaw();
    return rows
      .map((raw) => ({ raw, standing: standingOf(raw, now) }))
      .filter(({ standing }) => standing.overdueAmount.greaterThan(ZERO))
      .map(({ raw, standing }) => ({
        creditId: raw.id,
        customer: raw.customer.name,
        overdueAmount: Number(standing.overdueAmount),
      }));
  }

  async contract(id: string): Promise<CreditContract> {
    const raw = await this.require(id);
    const standing = standingOf(raw, new Date());
    const store = await this.stores.getIdentity();
    // The down payment is what was taken at creation: its payments share the
    // transaction instant and so occur at or before the credit's createdAt;
    // later payments occur strictly after. Derived, never stored.
    const downPayment = raw.payments
      .filter((p) => p.occurredAt <= raw.createdAt)
      .reduce((s, p) => s.plus(p.amount), new Prisma.Decimal(0));
    return {
      creditId: raw.id,
      createdAt: raw.createdAt,
      store: { name: store.name, address: store.address, phone: store.phone },
      customer: { name: raw.customer.name, phone: raw.customer.phone },
      goods: raw.sales.map((s) => {
        const ref = s.device?.model ?? s.model;
        return {
          description: ref ? `${ref.brand} ${ref.name}` : '',
          imei: s.device?.imei ?? null,
          serialNumber: s.device?.serialNumber ?? null,
          quantity: s.quantity,
          price: s.salePrice.toFixed(2),
        };
      }),
      agreedTotal: standing.agreedTotal.toFixed(2),
      downPayment: downPayment.toFixed(2),
      instalments: raw.instalments.map((i) => ({
        dueDate: i.dueDate,
        amount: i.amount.toFixed(2),
      })),
      terms: CONTRACT_TERMS,
    };
  }

  private async require(id: string, tx?: PrismaTx): Promise<CreditRaw> {
    const storeIds = await this.stores.currentStoreIds();
    const raw = await this.repo.findRawById(id, tx, storeIds);
    if (!raw) throw new NotFoundException(`Credit ${id} not found`);
    return raw;
  }
}

function matchesStatus(
  standing: CreditStanding,
  status?: 'open' | 'overdue' | 'settled',
): boolean {
  if (status === 'open') return !standing.settled;
  if (status === 'settled') return standing.settled;
  if (status === 'overdue') return standing.overdueAmount.greaterThan(ZERO);
  return true;
}
