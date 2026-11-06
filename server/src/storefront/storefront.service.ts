import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PricingService } from '../pricing/pricing.service.js';
import { storefrontOrderPlaced } from '../telegram/messages.js';
import { TelegramService } from '../telegram/telegram.service.js';
import type { CreateStorefrontOrderDto } from './dto/create-order.dto.js';
import type { ListStorefrontProductsQueryDto } from './dto/list-products.query.dto.js';
import type { UpdateStorefrontSettingsDto } from './dto/storefront-settings.dto.js';
import { isPlausiblePhone } from './lib/phone.js';
import {
  buildQuantityProductCards,
  buildQuantityProductDetail,
  buildUnitProductCards,
  buildUnitProductDetail,
} from './lib/product-shaping.js';
import {
  StorefrontRepository,
  type PublicModelRow,
  type PublicUnitRow,
} from './storefront.repository.js';
import type {
  StorefrontConfigView,
  StorefrontProductCard,
  StorefrontProductDetail,
  StorefrontSettingsView,
} from './types/storefront.types.js';

function assertStorefrontEnabled(settings: StorefrontSettingsView): void {
  if (!settings.enabled) {
    throw new NotFoundException({
      code: 'STOREFRONT_DISABLED',
      message: 'The storefront is currently disabled',
    });
  }
}

function groupUnitsByModel(
  units: PublicUnitRow[],
): Map<string, PublicUnitRow[]> {
  const map = new Map<string, PublicUnitRow[]>();
  for (const u of units) {
    if (!map.has(u.modelId)) map.set(u.modelId, []);
    map.get(u.modelId)!.push(u);
  }
  return map;
}

@Injectable()
export class StorefrontService {
  constructor(
    private readonly repo: StorefrontRepository,
    private readonly pricing: PricingService,
    private readonly telegram: TelegramService,
  ) {}

  async getConfig(): Promise<StorefrontConfigView> {
    const settings = await this.repo.getSettings();
    if (!settings.enabled) return { enabled: false };

    const [stores, categories] = await Promise.all([
      this.repo.activeStores(),
      this.repo.activeCategories(settings.categoryIds),
    ]);

    return {
      enabled: true,
      shopName: stores[0]?.name ?? 'Malika',
      contactPhone: settings.contactPhone,
      contactTelegram: settings.contactTelegram,
      showPrices: settings.showPrices,
      stores,
      categories,
    };
  }

  async getProducts(
    query: ListStorefrontProductsQueryDto,
  ): Promise<StorefrontProductCard[]> {
    const settings = await this.repo.getSettings();
    assertStorefrontEnabled(settings);

    const activeStores = await this.repo.activeStores();
    if (activeStores.length === 0) return [];
    const storeIds = activeStores.map((s) => s.id);
    const storeMap = new Map(activeStores.map((s) => [s.id, s.name]));

    const models = await this.repo.findActiveModels(
      settings.categoryIds,
      query.categoryId,
      query.search,
    );
    if (models.length === 0) return [];

    const unitModels = models.filter((m) => m.kindCode !== 'QUANTITY');
    const quantityModels = models.filter((m) => m.kindCode === 'QUANTITY');

    const [units, quantityMap] = await Promise.all([
      this.repo.inStockUnitsForModels(
        unitModels.map((m) => m.id),
        storeIds,
      ),
      this.repo.quantityStockForModels(
        quantityModels.map((m) => m.id),
        storeIds,
      ),
    ]);

    const unitsByModel = groupUnitsByModel(units);

    const [unitCards, quantityCards] = await Promise.all([
      buildUnitProductCards(
        unitModels,
        unitsByModel,
        storeMap,
        settings.showPrices,
        this.pricing,
      ),
      buildQuantityProductCards(
        quantityModels,
        quantityMap,
        storeMap,
        settings.showPrices,
        this.pricing,
      ),
    ]);

    const cards = [...unitCards, ...quantityCards];
    cards.sort(
      (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    return cards.slice((page - 1) * pageSize, page * pageSize);
  }

  async getProduct(modelId: string): Promise<StorefrontProductDetail> {
    const settings = await this.repo.getSettings();
    assertStorefrontEnabled(settings);

    const activeStores = await this.repo.activeStores();
    if (activeStores.length === 0)
      throw new NotFoundException('Product not found');
    const storeIds = activeStores.map((s) => s.id);
    const storeMap = new Map(activeStores.map((s) => [s.id, s.name]));

    const model = await this.repo.findModelById(modelId);
    if (!model) throw new NotFoundException('Product not found');

    if (
      settings.categoryIds.length > 0 &&
      (!model.categoryId || !settings.categoryIds.includes(model.categoryId))
    ) {
      throw new NotFoundException('Product not found');
    }

    if (model.kindCode === 'QUANTITY') {
      const qMap = await this.repo.quantityStockForModels([modelId], storeIds);
      const detail = await buildQuantityProductDetail(
        model,
        qMap.get(modelId),
        storeMap,
        settings.showPrices,
        this.pricing,
      );
      if (detail.inStock <= 0)
        throw new NotFoundException('Product is out of stock');
      return detail;
    }

    const units = await this.repo.inStockUnitsForModels([modelId], storeIds);
    if (units.length === 0)
      throw new NotFoundException('Product is out of stock');

    return buildUnitProductDetail(
      model,
      units,
      storeMap,
      settings.showPrices,
      this.pricing,
    );
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

    const { targetStore, model } = await this.validateOrderTarget(dto);

    const order = await this.repo.createOrder({
      storeId: dto.storeId,
      modelId: dto.modelId,
      specs: dto.specs ?? {},
      customerName: dto.name.trim(),
      customerPhone: dto.phone.trim(),
      note: dto.note?.trim(),
    });

    const alertText = storefrontOrderPlaced({
      storeName: targetStore.name,
      customerName: dto.name.trim(),
      customerPhone: dto.phone.trim(),
      productName: `${model.brand} ${model.name}`,
      specs: dto.specs,
      note: dto.note?.trim(),
    });
    await this.telegram.send(alertText, dto.storeId);

    return order;
  }

  private async validateOrderTarget(dto: CreateStorefrontOrderDto): Promise<{
    targetStore: { id: string; name: string };
    model: PublicModelRow;
  }> {
    const activeStores = await this.repo.activeStores();
    const targetStore = activeStores.find((s) => s.id === dto.storeId);
    if (!targetStore) {
      throw new BadRequestException({
        code: 'STORE_NOT_ACTIVE',
        message: 'The selected store is not active or does not exist',
      });
    }

    const model = await this.repo.findModelById(dto.modelId);
    if (!model) {
      throw new NotFoundException({
        code: 'MODEL_NOT_FOUND',
        message: 'Product not found',
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
        message: 'This product is not in stock in the selected store',
      });
    }

    return { targetStore, model };
  }

  getSettings(): Promise<StorefrontSettingsView> {
    return this.repo.getSettings();
  }

  updateSettings(
    dto: UpdateStorefrontSettingsDto,
  ): Promise<StorefrontSettingsView> {
    return this.repo.updateSettings(dto);
  }
}
