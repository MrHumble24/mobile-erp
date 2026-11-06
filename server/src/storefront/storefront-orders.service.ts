import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { HandOverStorefrontOrderDto } from './dto/hand-over-order.dto.js';
import type { HoldStorefrontOrderDto } from './dto/hold-order.dto.js';
import type { ListStorefrontOrdersQueryDto } from './dto/list-orders.query.dto.js';
import type { UpdateStorefrontOrderStatusDto } from './dto/update-order-status.dto.js';
import {
  toStorefrontOrderDetail,
  toStorefrontOrderListItem,
} from './lib/order-shaping.js';
import { assertValidTransition } from './lib/order-status.js';
import { StorefrontOrdersFulfillService } from './storefront-orders-fulfill.service.js';
import { StorefrontOrdersRepository } from './storefront-orders.repository.js';
import type {
  StorefrontOrderDetail,
  StorefrontOrderListItem,
} from './types/storefront.types.js';

@Injectable()
export class StorefrontOrdersService {
  constructor(
    private readonly repo: StorefrontOrdersRepository,
    private readonly prisma: PrismaService,
    private readonly fulfill: StorefrontOrdersFulfillService,
  ) {}

  async list(storeId: string, query: ListStorefrontOrdersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { items, total } = await this.repo.listOrders(storeId, {
      status: query.status,
      from: query.from,
      to: query.to,
      page,
      pageSize,
    });

    const mapped: StorefrontOrderListItem[] = items.map((row) =>
      toStorefrontOrderListItem(row as never),
    );

    return { items: mapped, total, page, pageSize };
  }

  async stats(storeId: string): Promise<{ new: number }> {
    const count = await this.repo.countNewOrders(storeId);
    return { new: count };
  }

  async get(storeId: string, id: string): Promise<StorefrontOrderDetail> {
    const order = await this.repo.findOrderById(storeId, id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found in this store`);
    }

    return toStorefrontOrderDetail(order);
  }

  async updateStatus(
    storeId: string,
    id: string,
    userId: string,
    dto: UpdateStorefrontOrderStatusDto,
  ): Promise<StorefrontOrderDetail> {
    const order = await this.repo.findOrderById(storeId, id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found in this store`);
    }

    assertValidTransition(
      order.statusCode,
      dto.statusCode,
      order.fulfillmentMethodCode,
    );

    if (dto.saleId) {
      const sale = await this.repo.findSaleInStore(storeId, dto.saleId);
      if (!sale) {
        throw new BadRequestException({
          code: 'INVALID_SALE',
          message: 'Sale does not belong to this store or does not exist',
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (
        dto.statusCode === 'CONTACTED' &&
        order.paymentMethodCode === 'ON_RECEIPT' &&
        !order.deviceId &&
        order.model.kindCode !== 'QUANTITY'
      ) {
        const specs =
          order.specs && typeof order.specs === 'object'
            ? (order.specs as Record<string, unknown>)
            : undefined;
        const unit = await this.repo.findOldestInStockUnit(
          order.modelId,
          storeId,
          specs,
          tx,
        );
        if (!unit) {
          throw new ConflictException({
            code: 'NO_STOCK_AVAILABLE',
            message: 'No in-stock unit available to hold for this order',
          });
        }
        await this.repo.holdDevice(order.id, unit.id, userId, tx);
      }

      if (dto.statusCode === 'CANCELLED' && order.deviceId) {
        await this.repo.releaseDevice(order.id, order.deviceId, userId, tx);
      }

      const updated = await this.repo.updateOrderStatus(
        storeId,
        id,
        order.statusCode,
        dto.statusCode,
        userId,
        dto.saleId,
        tx,
      );

      return toStorefrontOrderDetail(updated);
    });
  }

  hold(
    storeId: string,
    id: string,
    userId: string,
    dto?: HoldStorefrontOrderDto,
  ) {
    return this.fulfill.hold(storeId, id, userId, dto);
  }

  handOver(
    storeId: string,
    id: string,
    caller: AuthenticatedUser,
    dto: HandOverStorefrontOrderDto,
  ) {
    return this.fulfill.handOver(storeId, id, caller, dto);
  }
}
