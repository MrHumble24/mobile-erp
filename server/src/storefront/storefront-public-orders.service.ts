import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/client/client.js';
import { PricingService } from '../pricing/pricing.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import { storefrontOrderPlaced } from '../telegram/messages.js';
import type { CreateStorefrontOrderDto } from './dto/create-order.dto.js';
import { calculateDeliveryFee } from './lib/delivery-fee.js';
import { isPlausiblePhone } from './lib/phone.js';
import { resolveMinUnitPrice } from './lib/product-pricing.js';
import { StorefrontDeliveryZonesRepository } from './storefront-delivery-zones.repository.js';
import { StorefrontOrdersRepository } from './storefront-orders.repository.js';
import {
  PublicModelRow,
  StorefrontRepository,
} from './storefront.repository.js';
import type {
  PublicStorefrontOrderView,
  StorefrontSettingsView,
} from './types/storefront.types.js';

function assertStorefrontEnabled(settings: StorefrontSettingsView): void {
  if (!settings.enabled) {
    throw new NotFoundException({
      code: 'STOREFRONT_DISABLED',
      message: 'Storefront is currently disabled',
    });
  }
}

@Injectable()
export class StorefrontPublicOrdersService {
  constructor(
    private readonly repo: StorefrontRepository,
    private readonly ordersRepo: StorefrontOrdersRepository,
    private readonly zonesRepo: StorefrontDeliveryZonesRepository,
    private readonly pricing: PricingService,
    private readonly telegram: TelegramService,
  ) {}

  async getPublicOrder(id: string): Promise<PublicStorefrontOrderView> {
    const order = await this.ordersRepo.findPublicOrderById(id);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `Order ${id} not found`,
      });
    }

    return {
      id: order.id,
      statusCode: order.statusCode,
      statusLabel: order.status.label,
      fulfillmentMethod: order.fulfillmentMethodCode,
      productName: `${order.model.brand} ${order.model.name}`,
      priceSnapshot: order.priceSnapshot
        ? order.priceSnapshot.toFixed(2)
        : null,
      deliveryFeeSnapshot: order.deliveryFeeSnapshot.toFixed(2),
    };
  }

  async createOrder(dto: CreateStorefrontOrderDto): Promise<{ id: string }> {
    const settings = await this.repo.getSettings();
    assertStorefrontEnabled(settings);

    if (dto.hp?.trim() || dto.honeypot?.trim()) return { id: randomUUID() };
    if (!isPlausiblePhone(dto.phone)) {
      throw new BadRequestException({
        code: 'INVALID_PHONE',
        message: 'The phone number is not a plausible number',
      });
    }

    const fulfillment = (
      dto.fulfillmentMethod ??
      dto.deliveryMethod ??
      'PICKUP'
    ).toUpperCase();
    const payment = (dto.paymentMethod ?? 'ON_RECEIPT').toUpperCase();

    if (payment === 'ONLINE') {
      throw new BadRequestException({
        code: 'ONLINE_PAYMENT_NOT_AVAILABLE',
        message: 'Online payment is not yet available; pay on receipt',
      });
    }

    let address: string | null = null;
    let zoneRow: { id: string; fee: Prisma.Decimal; isActive: boolean } | null =
      null;

    if (fulfillment === 'DELIVERY') {
      if (!dto.address?.trim()) {
        throw new BadRequestException({
          code: 'ADDRESS_REQUIRED',
          message: 'Delivery address is required for delivery orders',
        });
      }
      address = dto.address.trim();

      if (settings.deliveryPricingModeCode === 'BY_ZONE') {
        if (!dto.deliveryZoneId) {
          throw new BadRequestException({
            code: 'DELIVERY_ZONE_REQUIRED',
            message:
              'Delivery zone is required for zone-based delivery pricing',
          });
        }
        zoneRow = await this.zonesRepo.findById(dto.deliveryZoneId);
        if (!zoneRow || !zoneRow.isActive) {
          throw new BadRequestException({
            code: 'DELIVERY_ZONE_INVALID',
            message: 'Delivery zone is invalid or inactive',
          });
        }
      }
    }

    const { targetStore, model } = await this.validateOrderTarget(
      dto,
      settings,
    );
    const priceSnapshot = await this.resolvePriceSnapshot(
      model,
      dto.storeId,
      dto.specs,
      settings.showPrices,
    );

    const deliveryFeeSnapshot = calculateDeliveryFee({
      fulfillmentMethod: fulfillment,
      pickupEnabled: settings.pickupEnabled,
      deliveryEnabled: settings.deliveryEnabled,
      pricingMode: settings.deliveryPricingModeCode,
      flatFee: settings.deliveryFlatFee,
      freeFrom: settings.deliveryFreeFrom,
      orderPrice: priceSnapshot,
      zone: zoneRow,
    });

    const name = dto.name.trim();
    const phone = dto.phone.trim();
    const note = dto.note?.trim();
    const specs = dto.specs ? { ...dto.specs } : {};

    const order = await this.ordersRepo.createOrder({
      storeId: dto.storeId,
      modelId: dto.modelId,
      specs,
      customerName: name,
      customerPhone: phone,
      note,
      fulfillmentMethodCode: fulfillment,
      address,
      deliveryZoneId: zoneRow?.id ?? null,
      paymentMethodCode: payment,
      priceSnapshot,
      deliveryFeeSnapshot,
    });

    await this.telegram.send(
      storefrontOrderPlaced({
        storeName: targetStore.name,
        customerName: name,
        customerPhone: phone,
        productName: `${model.brand} ${model.name}`,
        specs,
        note,
      }),
      dto.storeId,
    );

    return order;
  }

  private async resolvePriceSnapshot(
    model: PublicModelRow,
    storeId: string,
    specs?: { storage?: string; color?: string },
    showPrices = true,
  ): Promise<Prisma.Decimal | null> {
    if (!showPrices) return null;

    if (model.kindCode === 'QUANTITY') {
      const p = await this.pricing.listPriceForProduct('RETAIL', {
        modelId: model.id,
        storage: '',
        salePrice: model.salePrice,
      });
      return p !== null ? new Prisma.Decimal(p) : null;
    }

    const units = await this.repo.inStockUnitsForModels([model.id], [storeId]);
    const filtered = units.filter((u) => {
      const s =
        u.specs && typeof u.specs === 'object' && !Array.isArray(u.specs)
          ? (u.specs as Record<string, unknown>)
          : {};
      if (specs?.storage && s.storage !== specs.storage) return false;
      if (specs?.color && s.color !== specs.color) return false;
      return true;
    });

    const targetUnits = filtered.length > 0 ? filtered : units;
    const minStr = await resolveMinUnitPrice(model, targetUnits, this.pricing);
    return minStr !== null ? new Prisma.Decimal(minStr) : null;
  }

  private async validateOrderTarget(
    dto: CreateStorefrontOrderDto,
    settings: StorefrontSettingsView,
  ): Promise<{
    targetStore: { id: string; name: string };
    model: PublicModelRow;
  }> {
    const activeStores = await this.repo.activeStores();
    const targetStore = activeStores.find((s) => s.id === dto.storeId);
    if (!targetStore) {
      throw new BadRequestException({
        code: 'STORE_NOT_ACTIVE',
        message: 'Store not active',
      });
    }

    const model = await this.repo.findModelById(dto.modelId);
    const isHidden =
      settings.categoryIds.length > 0 &&
      (!model?.categoryId || !settings.categoryIds.includes(model.categoryId));
    if (!model || isHidden) {
      throw new NotFoundException({
        code: 'MODEL_NOT_FOUND',
        message: 'Product model not found or hidden',
      });
    }

    const inStock = await this.repo.countModelInStockForStore(
      dto.modelId,
      dto.storeId,
      model.kindCode,
      dto.specs,
    );
    if (inStock <= 0) {
      throw new BadRequestException({
        code: 'OUT_OF_STOCK',
        message: 'Selected product is out of stock in this branch',
      });
    }

    return { targetStore, model };
  }
}
