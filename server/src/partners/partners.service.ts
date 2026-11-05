import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../generated/client/client.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { StoresService } from '../stores/stores.service.js';
import {
  PartnerPaymentReceivedEvent,
  TelegramEvents,
} from '../telegram/events/telegram-events.js';
import { CreatePartnerDto } from './dto/create-partner.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { UpdatePartnerDto } from './dto/update-partner.dto.js';
import { PartnersRepository } from './partners.repository.js';
import { AgingBucket } from './lib/aging.js';
import {
  LedgerEntry,
  PartnerFilters,
  PartnerView,
  PaymentView,
} from './types/partner.types.js';

@Injectable()
export class PartnersService {
  constructor(
    private readonly repo: PartnersRepository,
    private readonly stores: StoresService,
    private readonly events: EventEmitter2,
  ) {}

  list(filters: PartnerFilters = {}): Promise<PartnerView[]> {
    return this.repo.listWithBalance(filters);
  }

  get(id: string): Promise<PartnerView> {
    return this.require(id);
  }

  async aging(id: string): Promise<AgingBucket[]> {
    await this.require(id);
    return this.repo.aging(id);
  }

  create(dto: CreatePartnerDto): Promise<PartnerView> {
    return this.repo.create({
      shopName: dto.shopName,
      contactPerson: dto.contactPerson,
      phone: dto.phone,
      telegramHandle: dto.telegramHandle,
      creditLimit: toDecimal(dto.creditLimit),
      notes: dto.notes,
    });
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<PartnerView> {
    await this.require(id);
    return this.repo.update(id, {
      shopName: dto.shopName,
      contactPerson: dto.contactPerson,
      phone: dto.phone,
      telegramHandle: dto.telegramHandle,
      creditLimit: toDecimal(dto.creditLimit),
      notes: dto.notes,
      isActive: dto.isActive,
    });
  }

  async ledger(id: string): Promise<LedgerEntry[]> {
    await this.require(id);
    return this.repo.ledger(id);
  }

  async recordPayment(
    caller: AuthenticatedUser,
    partnerId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentView> {
    const partner = await this.require(partnerId);
    if (dto.consignmentId) {
      const ok = await this.repo.consignmentBelongsTo(
        dto.consignmentId,
        partnerId,
      );
      if (!ok) {
        throw new BadRequestException(
          `Consignment ${dto.consignmentId} does not belong to partner ${partnerId}`,
        );
      }
    }
    const payment = await this.repo.createPayment({
      storeId: await this.stores.currentStoreId(),
      partnerId,
      consignmentId: dto.consignmentId,
      amount: new Prisma.Decimal(dto.amount),
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      notes: dto.notes,
      receivedById: caller.id,
    });
    this.events.emit(
      TelegramEvents.partnerPaymentReceived,
      new PartnerPaymentReceivedEvent(partner.shopName, Number(dto.amount)),
    );
    return payment;
  }

  /**
   * Credit-limit gate for a new consignment. Rejects when the partner's
   * outstanding balance plus this price would exceed a non-zero limit.
   */
  async assertWithinCreditLimit(
    partnerId: string,
    agreedPrice: Prisma.Decimal,
  ): Promise<void> {
    const credit = await this.repo.getCreditStatus(partnerId);
    if (!credit) throw new NotFoundException(`Partner ${partnerId} not found`);
    const projected = credit.outstanding.plus(agreedPrice);
    if (credit.creditLimit.gt(0) && projected.gt(credit.creditLimit)) {
      throw new ConflictException({
        message: 'Consignment would exceed partner credit limit',
        creditLimit: credit.creditLimit.toFixed(2),
        outstanding: credit.outstanding.toFixed(2),
        agreedPrice: agreedPrice.toFixed(2),
        projected: projected.toFixed(2),
      });
    }
  }

  private async require(id: string): Promise<PartnerView> {
    const partner = await this.repo.findWithBalance(id);
    if (!partner) throw new NotFoundException(`Partner ${id} not found`);
    return partner;
  }
}

function toDecimal(value?: number): Prisma.Decimal | undefined {
  return value === undefined ? undefined : new Prisma.Decimal(value);
}
