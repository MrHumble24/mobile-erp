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
import { LedgerService } from '../ledger/ledger.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import {
  SaleCreatedEvent,
  TelegramEvents,
} from '../telegram/events/telegram-events.js';
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
import { SalesRepository } from './sales.repository.js';
import type {
  ReceiptView,
  SalePayment,
  SaleView,
  WarrantyLookupView,
} from './types/sale.types.js';

@Injectable()
export class SalesService {
  constructor(
    private readonly reads: SalesRepository,
    private readonly checkout: SalesCheckoutRepository,
    private readonly stores: StoresService,
    private readonly ledger: LedgerService,
    private readonly stock: StockService,
    private readonly salesPricing: SalesPricingService,
    private readonly shifts: ShiftsService,
    private readonly events: EventEmitter2,
  ) {}

  async findByClientMutationId(id: string): Promise<SaleView | null> {
    const view = await this.reads.findByClientMutationId(id);
    return view ? this.withPayments(view) : null;
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
    const target = resolveSaleTarget(dto);
    const customer = await this.customerPricing(dto.customerId);
    if (target.kind === 'quantity') {
      return this.createQuantity(
        caller,
        dto,
        target.modelId,
        target.quantity,
        customer,
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
    const payments = resolveSalePayments(
      dto.payments,
      dto.salePrice,
      await this.ledger.activeAccountCodes(),
    );
    const days = dto.warrantyDays ?? (await this.reads.defaultWarrantyDays());
    const soldAt = new Date();
    return this.runCheckout(
      caller,
      dto,
      device,
      soldAt,
      days,
      payments,
      pricing,
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
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    device: {
      id: string;
      version: number;
      landedCost: Prisma.Decimal;
      targetPrice: Prisma.Decimal | null;
    },
    soldAt: Date,
    days: number,
    payments: SalePayment[],
    pricing: PricingOutcome,
  ): Promise<SaleView> {
    try {
      const saleId = await this.checkout.checkout({
        storeId: await this.stores.currentStoreId(),
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
      });
      const view = await this.withPayments(
        (await this.reads.findById(saleId))!,
      );
      this.emitSaleCreated(view, dto.salePrice, device);
      return view;
    } catch (e) {
      if (dto.clientMutationId && isUniqueViolation(e)) {
        const existing = await this.findByClientMutationId(
          dto.clientMutationId,
        );
        if (existing) return existing;
      }
      throw e;
    }
  }

  /**
   * A quantity-product sale (ADR 0030): no device, no warranty. The checkout
   * transaction snapshots the moving-average cost and posts the SALE stock
   * movement. Idempotent on `clientMutationId` like any sale.
   */
  private async createQuantity(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    modelId: string,
    quantity: number,
    customer: CustomerPricing | null,
    options?: CheckoutOptions,
  ): Promise<SaleView> {
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
    const payments = resolveSalePayments(
      dto.payments,
      dto.salePrice,
      await this.ledger.activeAccountCodes(),
    );
    try {
      const saleId = await this.checkout.checkoutQuantity({
        storeId: await this.stores.currentStoreId(),
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
      });
      return this.require(saleId);
    } catch (e) {
      if (dto.clientMutationId && isUniqueViolation(e)) {
        const existing = await this.findByClientMutationId(
          dto.clientMutationId,
        );
        if (existing) return existing;
      }
      throw e;
    }
  }

  private emitSaleCreated(
    view: SaleView,
    salePrice: number,
    device: { landedCost: Prisma.Decimal; targetPrice: Prisma.Decimal | null },
  ): void {
    this.events.emit(
      TelegramEvents.saleCreated,
      new SaleCreatedEvent(
        view.id,
        view.device?.imei ?? view.device?.serialNumber ?? '',
        `${view.device?.model.brand ?? ''} ${view.device?.model.name ?? ''}`.trim(),
        salePrice,
        device.targetPrice === null ? null : Number(device.targetPrice),
        Number(device.landedCost),
      ),
    );
  }

  async list(query: ListSalesQueryDto) {
    const page = await this.reads.list(query);
    return { ...page, items: await this.attachPayments(page.items) };
  }

  stats(query: ListSalesQueryDto) {
    return this.reads.stats(query);
  }

  get(id: string): Promise<SaleView> {
    return this.require(id);
  }

  async listByCustomer(customerId: string): Promise<SaleView[]> {
    return this.attachPayments(await this.reads.listByCustomer(customerId));
  }

  async warrantyLookup(imei: string): Promise<WarrantyLookupView> {
    const lookup = await this.reads.warrantyLookup(imei);
    if (!lookup) {
      throw new NotFoundException(`No sale found for IMEI ${imei}`);
    }
    return lookup;
  }

  async receipt(id: string): Promise<ReceiptView> {
    const receipt = await this.reads.receipt(id);
    if (!receipt) throw new NotFoundException(`Sale ${id} not found`);
    const payments = (await this.ledger.salePayments([id])).get(id) ?? [];
    return { ...receipt, payments };
  }

  private async require(id: string): Promise<SaleView> {
    const sale = await this.reads.findById(id);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return this.withPayments(sale);
  }

  /** Fill each view's `payments` from its SALE ledger rows. */
  private async attachPayments(views: SaleView[]): Promise<SaleView[]> {
    if (views.length === 0) return views;
    const map = await this.ledger.salePayments(views.map((v) => v.id));
    return views.map((v) => ({ ...v, payments: map.get(v.id) ?? [] }));
  }

  private async withPayments(view: SaleView): Promise<SaleView> {
    return (await this.attachPayments([view]))[0];
  }
}
