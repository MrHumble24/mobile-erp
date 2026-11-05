import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../generated/client/client.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StoresService } from '../stores/stores.service.js';
import {
  SaleCreatedEvent,
  TelegramEvents,
} from '../telegram/events/telegram-events.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { ListSalesQueryDto } from './dto/list-sales.query.dto.js';
import { ReturnSaleDto } from './dto/return-sale.dto.js';
import { buildRefundPostings } from './lib/refund.js';
import { resolveSalePayments } from './lib/payments.js';
import { warrantyEndsAt } from './lib/warranty.js';
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
    private readonly events: EventEmitter2,
  ) {}

  async findByClientMutationId(id: string): Promise<SaleView | null> {
    const view = await this.reads.findByClientMutationId(id);
    return view ? this.withPayments(view) : null;
  }

  async create(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
  ): Promise<SaleView> {
    if (dto.clientMutationId) {
      const existing = await this.findByClientMutationId(dto.clientMutationId);
      if (existing) return existing; // idempotent replay — no side effects
    }
    const device = await this.reads.findDeviceByImei(dto.imei);
    if (!device) {
      throw new NotFoundException(`Device with IMEI ${dto.imei} not found`);
    }
    if (device.statusCode !== 'IN_STOCK') {
      throw new ConflictException(
        `Device ${dto.imei} is ${device.statusCode}, not available for sale`,
      );
    }
    if (dto.customerId && !(await this.reads.customerExists(dto.customerId))) {
      throw new BadRequestException(`Customer ${dto.customerId} not found`);
    }
    const payments = resolveSalePayments(
      dto.payments,
      dto.salePrice,
      await this.ledger.activeAccountCodes(),
    );

    const days = dto.warrantyDays ?? (await this.reads.defaultWarrantyDays());
    const soldAt = new Date();
    return this.runCheckout(caller, dto, device, soldAt, days, payments);
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
  ): Promise<SaleView> {
    try {
      const saleId = await this.checkout.checkout({
        storeId: await this.stores.currentStoreId(),
        deviceId: device.id,
        expectedVersion: dto.expectedVersion ?? device.version,
        salePrice: dto.salePrice,
        landedCostSnapshot: device.landedCost,
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

  private emitSaleCreated(
    view: SaleView,
    salePrice: number,
    device: { landedCost: Prisma.Decimal; targetPrice: Prisma.Decimal | null },
  ): void {
    this.events.emit(
      TelegramEvents.saleCreated,
      new SaleCreatedEvent(
        view.id,
        view.device.imei,
        `${view.device.model.brand} ${view.device.model.name}`,
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
    return receipt;
  }

  async processReturn(
    caller: AuthenticatedUser,
    id: string,
    dto: ReturnSaleDto,
  ): Promise<SaleView> {
    const sale = await this.reads.findSaleForReturn(id);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    const device = await this.reads.findDeviceState(sale.deviceId);
    if (!device) throw new NotFoundException(`Sale ${id} device missing`);

    const saleNets = (await this.ledger.salePayments([id])).get(id) ?? [];
    await this.checkout.processReturn({
      saleId: id,
      deviceId: sale.deviceId,
      expectedVersion: dto.expectedVersion ?? device.version,
      toStatusCode: dto.deviceToStatusCode,
      refundAmount: dto.refundAmount,
      reason: dto.reason,
      processedById: caller.id,
      storeId: sale.storeId,
      refundPostings: buildRefundPostings(dto.refundAmount, saleNets),
    });
    return this.require(id);
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

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  );
}
