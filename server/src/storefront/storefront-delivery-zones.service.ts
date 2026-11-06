import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import type {
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto/delivery-zone.dto.js';
import { StorefrontDeliveryZonesRepository } from './storefront-delivery-zones.repository.js';
import type { StorefrontDeliveryZoneView } from './types/storefront.types.js';

@Injectable()
export class StorefrontDeliveryZonesService {
  constructor(private readonly repo: StorefrontDeliveryZonesRepository) {}

  async list(): Promise<StorefrontDeliveryZoneView[]> {
    const rows = await this.repo.findMany();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      fee: r.fee.toFixed(2),
      sortOrder: r.sortOrder,
      isActive: r.isActive,
    }));
  }

  async create(
    dto: CreateDeliveryZoneDto,
  ): Promise<StorefrontDeliveryZoneView> {
    try {
      const row = await this.repo.create({
        name: dto.name.trim(),
        fee: dto.fee,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      });
      return {
        id: row.id,
        name: row.name,
        fee: row.fee.toFixed(2),
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      };
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new ConflictException({
          code: 'DELIVERY_ZONE_NAME_EXISTS',
          message: `Delivery zone with name "${dto.name}" already exists`,
        });
      }
      throw e;
    }
  }

  async update(
    id: string,
    dto: UpdateDeliveryZoneDto,
  ): Promise<StorefrontDeliveryZoneView> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Delivery zone ${id} not found`);
    }

    try {
      const row = await this.repo.update(id, {
        name: dto.name?.trim(),
        fee: dto.fee,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      });
      return {
        id: row.id,
        name: row.name,
        fee: row.fee.toFixed(2),
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      };
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw new ConflictException({
          code: 'DELIVERY_ZONE_NAME_EXISTS',
          message: `Delivery zone with name "${dto.name}" already exists`,
        });
      }
      throw e;
    }
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Delivery zone ${id} not found`);
    }

    const orderCount = await this.repo.countOrdersForZone(id);
    if (orderCount > 0) {
      throw new BadRequestException({
        code: 'ZONE_IN_USE',
        message:
          'Cannot delete delivery zone referenced by orders; deactivate it instead',
      });
    }

    await this.repo.delete(id);
    return { deleted: true };
  }
}
