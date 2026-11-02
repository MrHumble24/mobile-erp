import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../generated/client/client.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import {
  SaleCreatedEvent,
  TelegramEvents,
} from '../telegram/events/telegram-events.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { ListSalesQueryDto } from './dto/list-sales.query.dto.js';
import { ReturnSaleDto } from './dto/return-sale.dto.js';
import { warrantyEndsAt } from './lib/warranty.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesRepository } from './sales.repository.js';
import type {
  ReceiptView,
  SaleView,
  WarrantyLookupView,
} from './types/sale.types.js';

@Injectable()
export class SalesService {
  constructor(
    private readonly reads: SalesRepository,
    private readonly checkout: SalesCheckoutRepository,
    private readonly events: EventEmitter2,
  ) {}

  findByClientMutationId(id: string): Promise<SaleView | null> {
    return this.reads.findByClientMutationId(id);
  }

  async create(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
  ): Promise<SaleView> {
    if (dto.clientMutationId) {
      const existing = await this.reads.findByClientMutationId(
        dto.clientMutationId,
      );
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

    const days = dto.warrantyDays ?? (await this.reads.defaultWarrantyDays());
    const soldAt = new Date();
    return this.runCheckout(caller, dto, device, soldAt, days);
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
  ): Promise<SaleView> {
    try {
      const saleId = await this.checkout.checkout({
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
      });
      const view = (await this.reads.findById(saleId))!;
      this.emitSaleCreated(view, dto.salePrice, device);
      return view;
    } catch (e) {
      if (dto.clientMutationId && isUniqueViolation(e)) {
        const existing = await this.reads.findByClientMutationId(
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

  list(query: ListSalesQueryDto) {
    return this.reads.list(query);
  }

  get(id: string): Promise<SaleView> {
    return this.require(id);
  }

  listByCustomer(customerId: string): Promise<SaleView[]> {
    return this.reads.listByCustomer(customerId);
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

    await this.checkout.processReturn({
      saleId: id,
      deviceId: sale.deviceId,
      expectedVersion: dto.expectedVersion ?? device.version,
      toStatusCode: dto.deviceToStatusCode,
      refundAmount: dto.refundAmount,
      reason: dto.reason,
      processedById: caller.id,
    });
    return (await this.reads.findById(id))!;
  }

  private async require(id: string): Promise<SaleView> {
    const sale = await this.reads.findById(id);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return sale;
  }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  );
}
