import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { SalesCreditService } from '../sales/sales-credit.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CreditsReadService } from './credits-read.service.js';
import { CreditsRepository } from './credits.repository.js';
import { CreditsWriteRepository } from './credits.write.repository.js';
import { CreateCreditDto } from './dto/create-credit.dto.js';
import { CreditPaymentDto } from './dto/credit-payment.dto.js';
import {
  assertFutureDueDates,
  assertPlanAddsUp,
  assertWithinLimit,
} from './lib/credit-validation.js';
import { toSaleDto } from './lib/credit-mapper.js';
import type { CreditView } from './types/credit.types.js';

const ZERO = new Prisma.Decimal(0);

/** Customer credit writes and the money rules around them (ADR 0035). */
@Injectable()
export class CreditsService {
  constructor(
    private readonly settings: SettingsService,
    private readonly stores: StoresService,
    private readonly ledger: LedgerService,
    private readonly salesCredit: SalesCreditService,
    private readonly shifts: ShiftsService,
    private readonly repo: CreditsRepository,
    private readonly writes: CreditsWriteRepository,
    private readonly read: CreditsReadService,
  ) {}

  /**
   * Creates a credit covering a cart of sales in one transaction: every line
   * goes through the normal checkout (same pricing/stock rules) with NO SALE
   * ledger rows, then the credit, its instalments and the down payment
   * (CREDIT_PAYMENT rows) are written. Any failure rolls the whole thing back.
   */
  async create(
    caller: AuthenticatedUser,
    dto: CreateCreditDto,
  ): Promise<CreditView> {
    const settings = await this.settings.get();
    if (!settings.customerCreditEnabled) {
      throw new BadRequestException('Customer credit is disabled');
    }
    if (dto.clientKey) {
      const existing = await this.repo.findRawByClientKey(dto.clientKey);
      if (existing) return this.read.get(existing.id); // idempotent replay
    }
    // Shift gate (ADR 0036): credit is online only, so an open shift is always
    // required when shifts are on.
    await this.shifts.assertCanSell(caller);
    const customer = await this.requireCustomerWithPhone(dto.customerId);
    const now = new Date();
    const dueDates = dto.instalments.map((i) => new Date(i.dueDate));
    assertFutureDueDates(dueDates, now);

    const accounts = await this.ledger.activeAccountCodes();
    const downPayments = this.validateDownPayments(
      dto.payments ?? [],
      accounts,
    );
    const downTotal = downPayments.reduce((s, p) => s.plus(p.amount), ZERO);
    const instalmentsTotal = dto.instalments.reduce(
      (s, i) => s.plus(new Prisma.Decimal(i.amount)),
      ZERO,
    );
    const limit = this.effectiveLimit(
      customer.creditLimit,
      settings.defaultCreditLimit,
    );
    const priorOutstanding = await this.repo.customerOutstanding(
      dto.customerId,
    );
    const storeId = await this.stores.currentStoreId();

    const creditId = await this.writes.transaction(async (tx) => {
      const id = await this.writes.createCredit(tx, {
        storeId,
        customerId: dto.customerId,
        createdById: caller.id,
        note: dto.note,
        clientKey: dto.clientKey,
      });
      let cartTotal = ZERO;
      for (const line of dto.lines) {
        const checked = await this.salesCredit.checkoutLine(
          caller,
          toSaleDto(line),
          { creditId: id, storeId, customerId: dto.customerId },
          tx,
        );
        cartTotal = cartTotal.plus(checked.salePrice);
      }
      assertPlanAddsUp(instalmentsTotal, downTotal, cartTotal);
      assertWithinLimit(priorOutstanding, cartTotal.minus(downTotal), limit);
      await this.writes.createInstalments(
        tx,
        id,
        dto.instalments.map((i) => ({
          dueDate: new Date(i.dueDate),
          amount: new Prisma.Decimal(i.amount),
        })),
      );
      for (const p of downPayments) {
        await this.postPayment(
          tx,
          caller,
          id,
          storeId,
          p.accountCode,
          p.amount,
          now,
        );
      }
      return id;
    });
    return this.read.get(creditId);
  }

  /** A later payment at the till (cash or card); may not exceed the outstanding. */
  async addPayment(
    caller: AuthenticatedUser,
    creditId: string,
    dto: CreditPaymentDto,
  ): Promise<CreditView> {
    const { standing } = await this.read.standing(creditId);
    await this.requireActiveAccount(dto.accountCode);
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.greaterThan(standing.outstanding)) {
      throw new BadRequestException(
        `Payment ${amount.toFixed(2)} exceeds the outstanding ${standing.outstanding.toFixed(2)}`,
      );
    }
    const storeId = await this.stores.currentStoreId();
    await this.writes.transaction((tx) =>
      this.postPayment(
        tx,
        caller,
        creditId,
        storeId,
        dto.accountCode,
        amount,
        new Date(),
      ),
    );
    return this.read.get(creditId);
  }

  /** Refunds an overpayment (after a return) as a negative CREDIT_PAYMENT, capped. */
  async refundOverpayment(
    caller: AuthenticatedUser,
    creditId: string,
    dto: CreditPaymentDto,
  ): Promise<CreditView> {
    const { standing } = await this.read.standing(creditId);
    await this.requireActiveAccount(dto.accountCode);
    if (standing.overpaid.lessThanOrEqualTo(ZERO)) {
      throw new BadRequestException('Nothing has been overpaid on this credit');
    }
    const requested = new Prisma.Decimal(dto.amount);
    const refund = requested.greaterThan(standing.overpaid)
      ? standing.overpaid
      : requested;
    const storeId = await this.stores.currentStoreId();
    await this.writes.transaction((tx) =>
      this.postPayment(
        tx,
        caller,
        creditId,
        storeId,
        dto.accountCode,
        refund.negated(),
        new Date(),
      ),
    );
    return this.read.get(creditId);
  }

  /** One credit payment row + its single CREDIT_PAYMENT ledger row, atomically. */
  private async postPayment(
    tx: PrismaTx,
    caller: AuthenticatedUser,
    creditId: string,
    storeId: string,
    accountCode: string,
    amount: Prisma.Decimal,
    occurredAt: Date,
  ): Promise<void> {
    const paymentId = await this.writes.createPayment(tx, {
      creditId,
      accountCode,
      amount,
      receivedById: caller.id,
      occurredAt,
    });
    await this.ledger.post(
      {
        storeId,
        accountCode,
        typeCode: 'CREDIT_PAYMENT',
        amount,
        occurredAt,
        creditPaymentId: paymentId,
        createdById: caller.id,
      },
      tx,
    );
  }

  private effectiveLimit(
    own: Prisma.Decimal | null,
    fallback: Prisma.Decimal | null,
  ): Prisma.Decimal | null {
    return own ?? fallback ?? null;
  }

  private async requireCustomerWithPhone(id: string) {
    const customer = await this.repo.customerForCredit(id);
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    if (!customer.phone) {
      throw new BadRequestException(
        'A credit customer must have a phone number',
      );
    }
    return customer;
  }

  private validateDownPayments(
    payments: { accountCode: string; amount: number }[],
    activeAccounts: string[],
  ): { accountCode: string; amount: Prisma.Decimal }[] {
    const seen = new Set<string>();
    return payments.map((p) => {
      if (!activeAccounts.includes(p.accountCode)) {
        throw new BadRequestException(
          `Unknown or inactive account ${p.accountCode}`,
        );
      }
      if (seen.has(p.accountCode)) {
        throw new BadRequestException(
          `Duplicate payment account ${p.accountCode}`,
        );
      }
      seen.add(p.accountCode);
      return {
        accountCode: p.accountCode,
        amount: new Prisma.Decimal(p.amount),
      };
    });
  }

  private async requireActiveAccount(code: string): Promise<void> {
    const accounts = await this.ledger.activeAccountCodes();
    if (!accounts.includes(code)) {
      throw new BadRequestException(`Unknown or inactive account ${code}`);
    }
  }
}
