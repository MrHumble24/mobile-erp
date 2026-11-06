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
  groupUnitsByModel,
} from './lib/product-shaping.js';
import { resolveCatalogPrices } from './lib/product-pricing.js';
import {
  StorefrontRepository,
  type PublicModelRow,
  type PublicUnitRow,
} from './storefront.repository.js';
import { StorefrontCatalogRepository } from './storefront-catalog.repository.js';
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

@Injectable()
export class StorefrontService {
  constructor(
    private readonly repo: StorefrontRepository,
    private readonly catalog: StorefrontCatalogRepository,
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

    const models = await this.catalog.findInStockModels(storeIds, {
      allowedCategoryIds: settings.categoryIds,
      categoryId: query.categoryId,
      search: query.search,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
    });
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

    return this.buildCatalogCards(
      unitModels,
      quantityModels,
      units,
      quantityMap,
      storeMap,
      settings.showPrices,
    );
  }

  private async buildCatalogCards(
    unitModels: PublicModelRow[],
    qtyModels: PublicModelRow[],
    units: PublicUnitRow[],
    qtyMap: Map<string, Map<string, number>>,
    storeMap: Map<string, string>,
    showPrices: boolean,
  ): Promise<StorefrontProductCard[]> {
    const unitsByModel = groupUnitsByModel(units);
    const { unitPrices, productPrices } = await resolveCatalogPrices(
      this.pricing,
      showPrices,
      units,
      qtyModels,
    );

    const [unitCards, quantityCards] = await Promise.all([
      buildUnitProductCards(
        unitModels,
        unitsByModel,
        storeMap,
        showPrices,
        unitPrices,
      ),
      buildQuantityProductCards(
        qtyModels,
        qtyMap,
        storeMap,
        showPrices,
        productPrices,
      ),
    ]);

    return [...unitCards, ...quantityCards].sort(
      (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
    );
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

    const { targetStore, model } = await this.validateOrderTarget(
      dto,
      settings,
    );

    const name = dto.name.trim();
    const phone = dto.phone.trim();
    const note = dto.note?.trim();
    const specs = dto.specs ? { ...dto.specs } : {};

    const order = await this.repo.createOrder({
      storeId: dto.storeId,
      modelId: dto.modelId,
      specs,
      customerName: name,
      customerPhone: phone,
      note,
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
        message: 'Product not found',
      });
    }

    const inStock = await this.repo.countModelInStockForStore(
      dto.modelId,
      dto.storeId,
      model.kindCode,
      dto.specs ? { ...dto.specs } : undefined,
    );
    if (inStock <= 0) {
      throw new BadRequestException({
        code: 'OUT_OF_STOCK',
        message: 'Out of stock',
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
