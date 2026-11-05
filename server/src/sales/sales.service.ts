import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../generated/client/client.js';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import { TelegramEvents } from '../telegram/events/telegram-events.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { ListSalesQueryDto } from './dto/list-sales.query.dto.js';
import { resolveSalePayments } from './lib/payments.js';
import { resolveSaleTarget } from './lib/sale-target.js';
import { warrantyEndsAt } from './lib/warranty.js';
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
import { buildSaleCreatedEvent } from './lib/sale-created-event.js';
import type {
  CheckoutInput,
  QuantityCheckoutInput,
  SalePayment,
  SaleView,
} from './types/sale.types.js';

interface RunCheckoutCtx {
  caller: AuthenticatedUser;
  dto: CreateSaleDto;
  device: {
    id: string;
    version: number;
    landedCost: Prisma.Decimal;
    targetPrice: Prisma.Decimal | null;
  };
  soldAt: Date;
  days: number;
  payments: SalePayment[];
  pricing: PricingOutcome;
}

@Injectable()
export class SalesService {
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
    private readonly events: EventEmitter2,
  ) {}

  findByClientMutationId(id: string): Promise<SaleView | null> {
    return this.read.findByClientMutationId(id);
  }

  list(query: ListSalesQueryDto) {
    return this.read.list(query);
  }

  stats(query: ListSalesQueryDto) {
    return this.read.stats(query);
  }

  get(id: string): Promise<SaleView> {
    return this.read.get(id);
  }

  listByCustomer(customerId: string): Promise<SaleView[]> {
    return this.read.listByCustomer(customerId);
  }

  warrantyLookup(imei: string) {
    return this.read.warrantyLookup(imei);
  }

  receipt(id: string) {
    return this.read.receipt(id);
  }

  async create(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    options?: CheckoutOptions,
  ): Promise<SaleView> {
    if (dto.clientMutationId) {
      const existing = await this.findByClientMutationId(dto.clientMutationId);
      if (existing) return existing; // idempotent replay — no side effects
    }
    // Shift gate (ADR 0036): when shifts are on, an online sale needs an open
    // shift; an offline replay is trusted and skips it.
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
        { modelId: target.modelId, quantity: target.quantity },
        customer,
        storeId,
        tradeIns,
        options,
      );
    }
    const device = await this.reads.findDeviceByImei(target.code);
    if (!device) throw new NotFoundException(`Device ${target.code} not found`);
    if (device.statusCode !== 'IN_STOCK') {
      throw new ConflictException(
        `Device ${target.code} is ${device.statusCode}, not available for sale`,
      );
    }
    const pricing = await this.salesPricing.forUnit(
      caller,
      dto,
      device,
      customer,
      options,
    );
    const payments = await this.resolvePayments(dto, tradeIns);
    const days = dto.warrantyDays ?? (await this.reads.defaultWarrantyDays());
    const soldAt = new Date();
    return this.runCheckout(
      { caller, dto, device, soldAt, days, payments, pricing },
      storeId,
      tradeIns,
    );
  }

  /** Tender lines resolved against sale price − Σ trade-in values (ADR 0039). */
  private async resolvePayments(
    dto: CreateSaleDto,
    tradeIns: PreparedTradeIns | null,
  ): Promise<SalePayment[]> {
    return resolveSalePayments(
      dto.payments,
      this.tradeIn.dueAmount(dto.salePrice, tradeIns),
      await this.ledger.activeAccountCodes(),
    );
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

  private async runCheckout(
    ctx: RunCheckoutCtx,
    storeId: string,
    tradeIns: PreparedTradeIns | null,
  ): Promise<SaleView> {
    const { caller, dto, device, soldAt, days, payments, pricing } = ctx;
    const input: CheckoutInput = {
      storeId,
      deviceId: device.id,
      expectedVersion: dto.expectedVersion ?? device.version,
      salePrice: pricing.salePrice,
      landedCostSnapshot: device.landedCost,
      listPriceSnapshot: pricing.listPriceSnapshot,
      priceLevelCode: pricing.priceLevelCode,
      soldById: caller.id,
      soldAt,
      notes: dto.notes,
      clientMutationId: dto.clientMutationId,
      customerId: dto.customerId,
      inlineCustomer: dto.customer,
      warranty: {
        days,
        startsAt: soldAt,
        endsAt: warrantyEndsAt(soldAt, days),
      },
      payments,
    };
    // Assemble/emit AFTER the transaction commits — reading back inside the
    // trade-in tx would not see the just-created sale.
    const saleId = await this.commit(dto, storeId, tradeIns, caller, (tx) =>
      this.checkout.checkout(input, tx),
    );
    const view = await this.read.require(saleId);
    this.events.emit(
      TelegramEvents.saleCreated,
      buildSaleCreatedEvent(view, dto.salePrice, device),
    );
    return view;
  }

  /**
   * A quantity-product sale (ADR 0030): no device, no warranty. The checkout
   * transaction snapshots the moving-average cost and posts the SALE stock
   * movement. Idempotent on `clientMutationId` like any sale.
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
    const payments = await this.resolvePayments(dto, tradeIns);
    const input: QuantityCheckoutInput = {
      storeId,
      modelId,
      quantity,
      salePrice: pricing.salePrice,
      listPriceSnapshot: pricing.listPriceSnapshot,
      priceLevelCode: pricing.priceLevelCode,
      soldById: caller.id,
      soldAt: new Date(),
      notes: dto.notes,
      clientMutationId: dto.clientMutationId,
      customerId: dto.customerId,
      inlineCustomer: dto.customer,
      payments,
    };
    const saleId = await this.commit(dto, storeId, tradeIns, caller, (tx) =>
      this.checkout.checkoutQuantity(input, tx),
    );
    return this.read.require(saleId);
  }

  /**
   * Run `checkout` (inside the trade-in transaction when there are trade-ins so
   * the sale and its purchases commit as one) and map a `clientMutationId`
   * collision back to the already-committed sale (idempotent replay). Returns
   * the sale id; the caller assembles the view AFTER the transaction commits.
   */
  private async commit(
    dto: CreateSaleDto,
    storeId: string,
    tradeIns: PreparedTradeIns | null,
    caller: AuthenticatedUser,
    checkout: (tx?: PrismaTx) => Promise<string>,
  ): Promise<string> {
    try {
      return await this.tradeIn.run(tradeIns, caller, storeId, checkout);
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
