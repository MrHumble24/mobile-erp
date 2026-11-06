import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ListStorefrontOrdersQueryDto } from './dto/list-orders.query.dto.js';
import type { UpdateStorefrontOrderStatusDto } from './dto/update-order-status.dto.js';
import { StorefrontOrdersRepository } from './storefront-orders.repository.js';
import type {
  StorefrontOrderDetail,
  StorefrontOrderListItem,
} from './types/storefront.types.js';

interface ProfileHolder {
  profile?: { firstName: string | null; lastName: string | null } | null;
}

function fullName(user?: ProfileHolder | null): string | null {
  if (!user?.profile) return null;
  const parts = [user.profile.firstName, user.profile.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

function assertValidTransition(
  currentStatus: string,
  nextStatus: string,
): void {
  if (currentStatus === 'DONE' || currentStatus === 'CANCELLED') {
    throw new BadRequestException({
      code: 'ORDER_TERMINAL',
      message: 'A terminal order cannot be changed',
    });
  }

  const validNextStates: Record<string, string[]> = {
    NEW: ['CONTACTED', 'CANCELLED'],
    CONTACTED: ['DONE', 'CANCELLED'],
  };

  const allowed = validNextStates[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException({
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot transition order from ${currentStatus} to ${nextStatus}`,
    });
  }
}

@Injectable()
export class StorefrontOrdersService {
  constructor(private readonly repo: StorefrontOrdersRepository) {}

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

    const mapped: StorefrontOrderListItem[] = items.map((row) => ({
      id: row.id,
      storeId: row.storeId,
      storeName: row.store.name,
      modelId: row.modelId,
      brand: row.model.brand,
      productName: row.model.name,
      specs:
        row.specs && typeof row.specs === 'object' && !Array.isArray(row.specs)
          ? (row.specs as Record<string, unknown>)
          : {},
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      note: row.note,
      statusCode: row.statusCode,
      statusLabel: row.status.label,
      handledAt: row.handledAt,
      handledByName: fullName(row.handledBy),
      saleId: row.saleId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

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

    return {
      id: order.id,
      storeId: order.storeId,
      storeName: order.store.name,
      modelId: order.modelId,
      brand: order.model.brand,
      productName: order.model.name,
      specs:
        order.specs &&
        typeof order.specs === 'object' &&
        !Array.isArray(order.specs)
          ? order.specs
          : {},
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      note: order.note,
      statusCode: order.statusCode,
      statusLabel: order.status.label,
      handledAt: order.handledAt,
      handledByName: fullName(order.handledBy),
      saleId: order.saleId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      history: order.statusHistory.map((h) => ({
        id: h.id,
        fromStatusCode: h.fromStatusCode,
        toStatusCode: h.toStatusCode,
        toStatusLabel: h.toStatus.label,
        changedAt: h.changedAt,
        changedByName: fullName(h.changedBy),
        note: h.note,
      })),
    };
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

    assertValidTransition(order.statusCode, dto.statusCode);

    if (dto.saleId) {
      const sale = await this.repo.findSaleInStore(storeId, dto.saleId);
      if (!sale) {
        throw new BadRequestException({
          code: 'INVALID_SALE',
          message: 'Sale does not belong to this store or does not exist',
        });
      }
    }

    const updated = await this.repo.updateOrderStatus(
      storeId,
      id,
      order.statusCode,
      dto.statusCode,
      userId,
      dto.saleId,
    );

    return {
      id: updated.id,
      storeId: updated.storeId,
      storeName: updated.store.name,
      modelId: updated.modelId,
      brand: updated.model.brand,
      productName: updated.model.name,
      specs:
        updated.specs &&
        typeof updated.specs === 'object' &&
        !Array.isArray(updated.specs)
          ? updated.specs
          : {},
      customerName: updated.customerName,
      customerPhone: updated.customerPhone,
      note: updated.note,
      statusCode: updated.statusCode,
      statusLabel: updated.status.label,
      handledAt: updated.handledAt,
      handledByName: fullName(updated.handledBy),
      saleId: updated.saleId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      history: updated.statusHistory.map((h) => ({
        id: h.id,
        fromStatusCode: h.fromStatusCode,
        toStatusCode: h.toStatusCode,
        toStatusLabel: h.toStatus.label,
        changedAt: h.changedAt,
        changedByName: fullName(h.changedBy),
        note: h.note,
      })),
    };
  }
}
