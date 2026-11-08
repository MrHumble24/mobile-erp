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
  validateDownPayments,
} from './lib/credit-validation.js';
import { toSaleDto } from './lib/credit-mapper.js';
import { distributeMarkup } from './lib/credit-markup.js';
import type { CreditView } from './types/credit.types.js';

interface CreateCreditTx {
  dto: CreateCreditDto;
  caller: AuthenticatedUser;
  storeId: string;
  downPayments: { accountCode: string; amount: Prisma.Decimal }[];
  instalmentsTotal: Prisma.Decimal;
  downTotal: Prisma.Decimal;
  /** One disclosed, fixed margin agreed up front (ADR 0068). */
  markup: Prisma.Decimal;
  limit: Prisma.Decimal | null;
  now: Date;
}

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
    assertFutureDueDates(
      dto.instalments.map((i) => new Date(i.dueDate)),
      now,
    );
    const accounts = await this.ledger.activeAccountCodes();
    const downPayments = validateDownPayments(dto.payments ?? [], accounts);
    const markup = new Prisma.Decimal(dto.markupAmount ?? 0);
    // The margin is a disclosed part of the price, never more than the goods
    // themselves: this also keeps cashPrice = agreedTotal − margin non-negative.
    const cashClaim = dto.lines.reduce(
      (s, l) => s.plus(new Prisma.Decimal(l.salePrice)),
      ZERO,
    );
    if (markup.greaterThan(cashClaim)) {
      throw new BadRequestException(
        'Agreed margin cannot exceed the cash price',
      );
    }
    const ctx: CreateCreditTx = {
      dto,
      caller,
      storeId: await this.stores.currentStoreId(),
      downPayments,
      instalmentsTotal: dto.instalments.reduce(
        (s, i) => s.plus(new Prisma.Decimal(i.amount)),
        ZERO,
      ),
      downTotal: downPayments.reduce((s, p) => s.plus(p.amount), ZERO),
      markup,
      limit: this.effectiveLimit(
        customer.creditLimit,
        settings.defaultCreditLimit,
      ),
      now,
    };
    const creditId = await this.writes.transaction((tx) =>
      this.writeCredit(tx, ctx),
    );
    return this.read.get(creditId);
  }

  /**
   * The credit's writes in one transaction. The customer row is locked and their
   * outstanding read **inside** it (ADR 0028), so two concurrent credits cannot
   * both slip past the limit on a stale read.
   */
  private async writeCredit(
    tx: PrismaTx,
    ctx: CreateCreditTx,
  ): Promise<string> {
    const { dto, caller, storeId, now } = ctx;
    await this.repo.lockCustomer(tx, dto.customerId);
    const priorOutstanding = await this.repo.customerOutstanding(
      dto.customerId,
      tx,
    );
    const id = await this.writes.createCredit(tx, {
      storeId,
      customerId: dto.customerId,
      createdById: caller.id,
      note: dto.note,
      clientKey: dto.clientKey,
      markupAmount: ctx.markup,
    });
    const cartTotal = await this.checkoutLines(tx, ctx, id);
    assertPlanAddsUp(ctx.instalmentsTotal, ctx.downTotal, cartTotal);
    assertWithinLimit(
      priorOutstanding,
      cartTotal.minus(ctx.downTotal),
      ctx.limit,
    );
    await this.writes.createInstalments(
      tx,
      id,
      dto.instalments.map((i) => ({
        dueDate: new Date(i.dueDate),
        amount: new Prisma.Decimal(i.amount),
      })),
    );
    for (const p of ctx.downPayments) {
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
  }

  /**
   * Check out every credit-cart line (no SALE ledger rows) and sum the AGREED
   * cart total = Σ cash prices + the disclosed margin. Each line is still
   * priced by the normal cash checkout first (so no `sale.price.override` is
   * needed), then the server folds its share of the margin into the Sale row.
   */
  private async checkoutLines(
    tx: PrismaTx,
    ctx: CreateCreditTx,
    creditId: string,
  ): Promise<Prisma.Decimal> {
    const { dto, caller, storeId } = ctx;
    const shares = distributeMarkup(
      dto.lines.map((l) => new Prisma.Decimal(l.salePrice)),
      ctx.markup,
    );
    let cartTotal = ZERO;
    for (let i = 0; i < dto.lines.length; i++) {
      const checked = await this.salesCredit.checkoutLine(
        caller,
        toSaleDto(dto.lines[i]),
        { creditId, storeId, customerId: dto.customerId },
        tx,
        shares[i],
      );
      cartTotal = cartTotal.plus(checked.salePrice);
    }
    return cartTotal;
  }

  /** A later payment at the till (cash or card); may not exceed the outstanding. */
  async addPayment(
    caller: AuthenticatedUser,
    creditId: string,
    dto: CreditPaymentDto,
  ): Promise<CreditView> {
    await this.requireActiveAccount(dto.accountCode);
    const amount = new Prisma.Decimal(dto.amount);
    const storeId = await this.stores.currentStoreId();
    await this.writes.transaction(async (tx) => {
      // Lock the credit, then read the standing inside the tx (ADR 0028): two
      // concurrent payments cannot together pay more than is owed.
      await this.repo.lockCredit(tx, creditId);
      const { standing } = await this.read.standing(creditId, tx);
      if (amount.greaterThan(standing.outstanding)) {
        throw new BadRequestException(
          `Payment ${amount.toFixed(2)} exceeds the outstanding ${standing.outstanding.toFixed(2)}`,
        );
      }
      await this.postPayment(
        tx,
        caller,
        creditId,
        storeId,
        dto.accountCode,
        amount,
        new Date(),
      );
    });
    return this.read.get(creditId);
  }

  /** Refunds an overpayment (after a return) as a negative CREDIT_PAYMENT, capped. */
  async refundOverpayment(
    caller: AuthenticatedUser,
    creditId: string,
    dto: CreditPaymentDto,
  ): Promise<CreditView> {
    await this.requireActiveAccount(dto.accountCode);
    const requested = new Prisma.Decimal(dto.amount);
    const storeId = await this.stores.currentStoreId();
    await this.writes.transaction(async (tx) => {
      await this.repo.lockCredit(tx, creditId);
      const { standing } = await this.read.standing(creditId, tx);
      if (standing.overpaid.lessThanOrEqualTo(ZERO)) {
        throw new BadRequestException(
          'Nothing has been overpaid on this credit',
        );
      }
      const refund = requested.greaterThan(standing.overpaid)
        ? standing.overpaid
        : requested;
      await this.postPayment(
        tx,
        caller,
        creditId,
        storeId,
        dto.accountCode,
        refund.negated(),
        new Date(),
      );
    });
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

  private async requireActiveAccount(code: string): Promise<void> {
    const accounts = await this.ledger.activeAccountCodes();
    if (!accounts.includes(code)) {
      throw new BadRequestException(`Unknown or inactive account ${code}`);
    }
  }
}
