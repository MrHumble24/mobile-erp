import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { PartnersService } from '../partners/partners.service.js';
import { ConsignmentsRepository } from './consignments.repository.js';
import { ConsignmentsWriteRepository } from './consignments.write.repository.js';
import { CreateConsignmentDto } from './dto/create-consignment.dto.js';
import { ListConsignmentsQuery } from './dto/list-consignments.query.js';
import { ReturnConsignmentDto } from './dto/return-consignment.dto.js';
import { SettleConsignmentDto } from './dto/settle-consignment.dto.js';
import {
  ConsignmentPage,
  ConsignmentView,
  OverdueConsignment,
} from './types/consignment.types.js';

@Injectable()
export class ConsignmentsService {
  constructor(
    private readonly reads: ConsignmentsRepository,
    private readonly writes: ConsignmentsWriteRepository,
    private readonly partners: PartnersService,
  ) {}

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
    const agreedPrice = new Prisma.Decimal(dto.agreedPrice);
    // ponytail: credit check reads balance outside the write txn; a concurrent
    // transfer could briefly overshoot the limit. Acceptable at bazaar scale.
    await this.partners.assertWithinCreditLimit(dto.partnerId, agreedPrice);
    return this.writes.createTransfer({
      imei: dto.imei,
      partnerId: dto.partnerId,
      agreedPrice,
      dueDate: new Date(dto.dueDate),
      notes: dto.notes,
      clientMutationId: dto.clientMutationId,
      expectedVersion: dto.expectedVersion,
      createdById: caller.id,
    });
  }

  list(query: ListConsignmentsQuery): Promise<ConsignmentPage> {
    return this.reads.list(
      {
        partnerId: query.partnerId,
        statusCode: query.statusCode,
        overdue: query.overdue,
      },
      query.page ?? 1,
      query.pageSize ?? 20,
    );
  }

  overdue(): Promise<OverdueConsignment[]> {
    return this.reads.findOverdue();
  }

  async get(id: string): Promise<ConsignmentView> {
    const c = await this.reads.findById(id);
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
      expectedVersion: dto.expectedVersion,
      changedById: caller.id,
    });
  }
}
