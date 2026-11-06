import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BonusService } from '../bonus/bonus.service.js';
import type { BonusPlan } from '../bonus/types/bonus.types.js';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import { TelegramEvents } from '../telegram/events/telegram-events.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import {
  buildQuantityCheckoutInput,
  buildUnitCheckoutInput,
} from './lib/checkout-input.js';
import { buildSaleCreatedEvent } from './lib/sale-created-event.js';
import { resolveSalePayments } from './lib/payments.js';
import { resolveSaleTarget } from './lib/sale-target.js';
import {
  SalesPricingService,
  type CheckoutOptions,
  type CustomerPricing,
  type PricingOutcome,
} from './sales-pricing.service.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesReadService } from './sales-read.service.js';
import {
  SalesTradeInService,
  type PreparedTradeIns,
} from './sales-trade-in.service.js';
import { SalesRepository } from './sales.repository.js';
import type { SalePayment, SaleView } from './types/sale.types.js';

const ZERO = new Prisma.Decimal(0);

/** The bonus plan + tender lines for a sale, resolved together (one price). */
interface Tender {
  bonus: BonusPlan;
  payments: SalePayment[];
}

/**
 * The checkout write path (unit + quantity sales). Resolves pricing, trade-ins
 * (ADR 0039) and bonus points (ADR 0043), tenders the balance, and commits the
 * sale with its purchases and points in one transaction. Split from the read
 * facade (SalesService) so each has one reason to change.
 */
@Injectable()
export class SalesCreateService {
  constructor(
    private readonly reads: SalesRepository,
    private readonly read: SalesReadService,
    private readonly checkout: SalesCheckoutRepository,
    private readonly stores: StoresService,
    private readonly ledger: LedgerService,
    private readonly stock: StockService,
    private readonly salesPricing: SalesPricingService,
    private readonly shifts: ShiftsService,
    private readonly tradeIn: SalesTradeInService,
    private readonly bonus: BonusService,
    private readonly events: EventEmitter2,
  ) {}

  async create(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    options?: CheckoutOptions,
  ): Promise<SaleView> {
    if (dto.clientMutationId) {
      const existing = await this.read.findByClientMutationId(
        dto.clientMutationId,
      );
      if (existing) return existing; // idempotent replay — no side effects
    }
    // Shift gate (ADR 0036): online needs an open shift; a replay is trusted.
    await this.shifts.assertCanSell(caller, { fromSync: options?.fromSync });
    // Trade-ins (ADR 0039): validate, resolve the seller onto dto.customerId.
    const tradeIns = await this.tradeIn.prepare(caller, dto, options);
    const target = resolveSaleTarget(dto);
    const customer = await this.customerPricing(dto.customerId);
    const storeId = await this.stores.currentStoreId();
    if (target.kind === 'quantity') {
      return this.createQuantity(
        caller,
        dto,
        target,
        customer,
        storeId,
        tradeIns,
        options,
      );
    }
    return this.sellUnit(
      caller,
      dto,
      target.code,
      customer,
      storeId,
      tradeIns,
      options,
    );
  }

  /** A unit (IMEI/serial) sale: load + guard the device, tender, commit, emit. */
  private async sellUnit(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    code: string,
    customer: CustomerPricing | null,
    storeId: string,
    tradeIns: PreparedTradeIns | null,
    options?: CheckoutOptions,
  ): Promise<SaleView> {
    const device = await this.reads.findDeviceByImei(code, storeId);
    if (!device) throw new NotFoundException(`Device ${code} not found`);
    const isHold =
      device.statusCode === 'RESERVED' &&
      Boolean(options?.storefrontOrderId) &&
      (await this.reads.isDeviceHeldByOrder(
        device.id,
        options!.storefrontOrderId!,
      ));
    if (device.statusCode !== 'IN_STOCK' && !isHold) {
      throw new ConflictException(
        `Device ${code} is ${device.statusCode}, not available for sale`,
      );
    }
    const pricing = await this.salesPricing.forUnit(
      caller,
      dto,
      device,
      customer,
      options,
    );
    const tender = await this.tender(dto, pricing, tradeIns, options);
    const days = dto.warrantyDays ?? (await this.reads.defaultWarrantyDays());
    const input = buildUnitCheckoutInput({
      storeId,
      caller,
      dto,
      device,
      pricing,
      payments: tender.payments,
      soldAt: new Date(),
      days,
    });
    const saleId = await this.commit(
      dto,
      storeId,
      tradeIns,
      caller,
      (tx) => this.checkout.checkout(input, tx),
      tender,
      options,
    );
    const view = await this.read.require(saleId);
    this.events.emit(
      TelegramEvents.saleCreated,
      buildSaleCreatedEvent(view, dto.salePrice, device),
    );
    return view;
  }

  /**
   * A quantity-product sale (ADR 0030): no device, no warranty. Earns / spends
   * points like any sale. Idempotent on `clientMutationId`.
   */
  private async createQuantity(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    target: { modelId: string; quantity: number },
    customer: CustomerPricing | null,
    storeId: string,
    tradeIns: PreparedTradeIns | null,
    options?: CheckoutOptions,
  ): Promise<SaleView> {
    const { modelId, quantity } = target;
    await this.stock.assertQuantityModel(modelId);
    const salePrice = await this.reads.modelSalePrice(modelId);
    const pricing = await this.salesPricing.forQuantity(
      caller,
      dto,
      modelId,
      quantity,
      salePrice,
      customer,
      options,
    );
    const tender = await this.tender(dto, pricing, tradeIns, options);
    const input = buildQuantityCheckoutInput({
      storeId,
      caller,
      dto,
      modelId,
      quantity,
      pricing,
      payments: tender.payments,
    });
    const saleId = await this.commit(
      dto,
      storeId,
      tradeIns,
      caller,
      (tx) => this.checkout.checkoutQuantity(input, tx),
      tender,
      options,
    );
    return this.read.require(saleId);
  }

  /** Resolve the points plan and the cash/card tender lines for one price. */
  private async tender(
    dto: CreateSaleDto,
    pricing: PricingOutcome,
    tradeIns: PreparedTradeIns | null,
    options?: CheckoutOptions,
  ): Promise<Tender> {
    const bonus = await this.bonus.prepareForSale({
      customerId: dto.customerId,
      salePrice: pricing.salePrice,
      tradeInTotal: tradeIns?.total ?? ZERO,
      requestedRedeem: dto.bonusRedeem,
      fromSync: options?.fromSync,
    });
    const dueBeforeBonus = this.tradeIn.dueAmount(
      pricing.salePrice.toNumber(),
      tradeIns,
    );
    const due = new Prisma.Decimal(dueBeforeBonus).minus(bonus.redeem);
    const payments = resolveSalePayments(
      dto.payments,
      due.toNumber(),
      await this.ledger.activeAccountCodes(),
    );
    return { bonus, payments };
  }

  /** Fetch a customer's pricing defaults; 400 when the id does not exist. */
  private async customerPricing(
    customerId?: string,
  ): Promise<CustomerPricing | null> {
    if (!customerId) return null;
    const c = await this.reads.customerPricing(customerId);
    if (!c) throw new BadRequestException(`Customer ${customerId} not found`);
    return c;
  }

  /**
   * Run `checkout`, create any trade-ins, and post the sale's bonus points — all
   * in one transaction (ADR 0039/0043) — and map a `clientMutationId` collision
   * back to the already-committed sale (idempotent replay). Returns the sale id.
   */
  private async commit(
    dto: CreateSaleDto,
    storeId: string,
    tradeIns: PreparedTradeIns | null,
    caller: AuthenticatedUser,
    checkout: (tx?: PrismaTx) => Promise<string>,
    tender: Tender,
    options?: CheckoutOptions,
  ): Promise<string> {
    const paid = tender.payments.reduce((s, p) => s.plus(p.amount), ZERO);
    const needsBonus =
      tender.bonus.redeem.greaterThan(0) || tender.bonus.enabled;
    const afterSale = needsBonus
      ? (tx: PrismaTx, saleId: string) =>
          this.bonus.postForSale(tx, saleId, tender.bonus, paid, caller.id)
      : undefined;
    try {
      return await this.tradeIn.run(
        tradeIns,
        caller,
        storeId,
        checkout,
        afterSale,
        options?.tx,
      );
    } catch (e) {
      if (dto.clientMutationId && isUniqueViolation(e)) {
        const existing = await this.read.findByClientMutationId(
          dto.clientMutationId,
        );
        if (existing) return existing.id;
      }
      throw e;
    }
  }
}
