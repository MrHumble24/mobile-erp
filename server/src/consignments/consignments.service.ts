import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../generated/client/client.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { DevicesService } from '../devices/devices.service.js';
import { resolveUnitCode } from '../devices/lib/unit-code.js';
import { PartnersService } from '../partners/partners.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { StoresService } from '../stores/stores.service.js';
import {
  ConsignmentCreatedEvent,
  TelegramEvents,
} from '../telegram/events/telegram-events.js';
import { ConsignmentsRepository } from './consignments.repository.js';
import { ConsignmentsWriteRepository } from './consignments.write.repository.js';
import { CreateConsignmentDto } from './dto/create-consignment.dto.js';
import { ListConsignmentsQuery } from './dto/list-consignments.query.js';
import { ReturnConsignmentDto } from './dto/return-consignment.dto.js';
import { SettleConsignmentDto } from './dto/settle-consignment.dto.js';
import {
  ConsignmentPage,
  ConsignmentStats,
  ConsignmentView,
  OverdueConsignment,
} from './types/consignment.types.js';

function toFilters(query: ListConsignmentsQuery) {
  return {
    partnerId: query.partnerId,
    statusCode: query.statusCode,
    overdue: query.overdue,
    search: query.search,
    from: query.from,
    to: query.to,
  };
}

@Injectable()
export class ConsignmentsService {
  constructor(
    private readonly reads: ConsignmentsRepository,
    private readonly writes: ConsignmentsWriteRepository,
    private readonly partners: PartnersService,
    private readonly stores: StoresService,
    private readonly devices: DevicesService,
    private readonly pricing: PricingService,
    private readonly events: EventEmitter2,
  ) {}

  findByClientMutationId(id: string): Promise<ConsignmentView | null> {
    return this.reads.findByClientMutationId(id);
  }

  /** One-tap transfer. Idempotent on clientMutationId; enforces credit limit. */
  async create(
    caller: AuthenticatedUser,
    dto: CreateConsignmentDto,
  ): Promise<ConsignmentView> {
    if (dto.clientMutationId) {
      const existing = await this.reads.findByClientMutationId(
        dto.clientMutationId,
      );
      if (existing) return existing;
    }
    const code = resolveUnitCode(dto);
    const agreedPrice = await this.resolveAgreedPrice(code, dto.agreedPrice);
    // ponytail: credit check reads balance outside the write txn; a concurrent
    // transfer could briefly overshoot the limit. Acceptable at bazaar scale.
    await this.partners.assertWithinCreditLimit(dto.partnerId, agreedPrice);
    const view = await this.writes.createTransfer({
      storeId: await this.stores.currentStoreId(),
      code,
      partnerId: dto.partnerId,
      agreedPrice,
      dueDate: new Date(dto.dueDate),
      notes: dto.notes,
      clientMutationId: dto.clientMutationId,
      expectedVersion: dto.expectedVersion,
      createdById: caller.id,
    });
    const partner = await this.partners.get(dto.partnerId);
    this.events.emit(
      TelegramEvents.consignmentCreated,
      new ConsignmentCreatedEvent(
        partner.shopName,
        view.imei ?? view.serialNumber ?? '',
        Number(view.agreedPrice),
        view.dueDate,
      ),
    );
    return view;
  }

  /**
   * An explicit agreed price wins; otherwise use the unit's PARTNER list price
   * (ADR 0034). 404 if the unit is missing, 400 if it has no PARTNER price.
   */
  private async resolveAgreedPrice(
    code: string,
    explicit?: number,
  ): Promise<Prisma.Decimal> {
    if (explicit !== undefined) return new Prisma.Decimal(explicit);
    const device = await this.devices.findByCode(code);
    if (!device) throw new NotFoundException(`Device ${code} not found`);
    const price = await this.pricing.listPriceForUnit('PARTNER', {
      deviceId: device.id,
      modelId: device.modelId,
      storage: storageOf(device.specs),
      targetPrice:
        device.targetPrice === null
          ? null
          : new Prisma.Decimal(device.targetPrice),
      salePrice: null,
    });
    if (price === null) {
      throw new BadRequestException(
        `Unit ${code} has no PARTNER price; provide an agreed price`,
      );
    }
    return price;
  }

  async list(query: ListConsignmentsQuery): Promise<ConsignmentPage> {
    const storeIds = await this.stores.currentStoreIds();
    return this.reads.list(
      toFilters(query),
      query.page ?? 1,
      query.pageSize ?? 20,
      storeIds,
    );
  }

  async stats(query: ListConsignmentsQuery): Promise<ConsignmentStats> {
    const storeIds = await this.stores.currentStoreIds();
    return this.reads.stats(toFilters(query), storeIds);
  }

  overdue(): Promise<OverdueConsignment[]> {
    return this.reads.findOverdue();
  }

  async get(id: string): Promise<ConsignmentView> {
    const storeIds = await this.stores.currentStoreIds();
    const c = await this.reads.findById(id, storeIds);
    if (!c) throw new NotFoundException(`Consignment ${id} not found`);
    return c;
  }

  settle(
    caller: AuthenticatedUser,
    id: string,
    dto: SettleConsignmentDto,
  ): Promise<ConsignmentView> {
    return this.writes.settle(id, {
      salePrice:
        dto.salePrice === undefined
          ? undefined
          : new Prisma.Decimal(dto.salePrice),
      notes: dto.notes,
      expectedVersion: dto.expectedVersion,
      soldById: caller.id,
    });
  }

  returnToStock(
    caller: AuthenticatedUser,
    id: string,
    dto: ReturnConsignmentDto,
  ): Promise<ConsignmentView> {
    return this.writes.returnToStock(id, {
      reason: dto.reason,
      condition: dto.condition,
      expectedVersion: dto.expectedVersion,
      changedById: caller.id,
    });
  }
}

function storageOf(specs: Record<string, unknown>): string {
  const value = specs.storage;
  return typeof value === 'string' ? value : '';
}
