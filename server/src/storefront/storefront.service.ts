import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PricingService } from '../pricing/pricing.service.js';
import type { CreateStorefrontOrderDto } from './dto/create-order.dto.js';
import type { ListStorefrontProductsQueryDto } from './dto/list-products.query.dto.js';
import type { UpdateStorefrontSettingsDto } from './dto/storefront-settings.dto.js';
import {
  buildQuantityProductCards,
  buildQuantityProductDetail,
  buildUnitProductCards,
  buildUnitProductDetail,
  groupUnitsByModel,
} from './lib/product-shaping.js';
import { resolveCatalogPrices } from './lib/product-pricing.js';
import { StorefrontCatalogRepository } from './storefront-catalog.repository.js';
import { StorefrontDeliveryZonesRepository } from './storefront-delivery-zones.repository.js';
import { StorefrontPublicOrdersService } from './storefront-public-orders.service.js';
import { StorefrontPayService } from './storefront-pay.service.js';
import { OnlinePaymentsRepository } from '../online-payments/online-payments.repository.js';
import {
  PublicModelRow,
  PublicUnitRow,
  StorefrontRepository,
} from './storefront.repository.js';
import type {
  PublicStorefrontOrderView,
  StorefrontConfigView,
  StorefrontProductCard,
  StorefrontProductDetail,
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
export class StorefrontService {
  constructor(
    private readonly repo: StorefrontRepository,
    private readonly catalog: StorefrontCatalogRepository,
    private readonly zonesRepo: StorefrontDeliveryZonesRepository,
    private readonly pricing: PricingService,
    private readonly ordersService: StorefrontPublicOrdersService,
    private readonly paymentsRepo: OnlinePaymentsRepository,
    private readonly payService: StorefrontPayService,
  ) {}

  async getConfig(): Promise<StorefrontConfigView> {
    const settings = await this.repo.getSettings();
    if (!settings.enabled) return { enabled: false };

    const [stores, categories, zones, paymentConfigs] = await Promise.all([
      this.repo.activeStores(),
      this.repo.activeCategories(settings.categoryIds),
      this.zonesRepo.findActive(),
      this.paymentsRepo.listConfigs(),
    ]);

    const paymentProviders = paymentConfigs
      .filter((c) => c.isEnabled)
      .map((c) => ({ code: c.providerCode, label: c.provider.label }));

    return {
      enabled: true,
      shopName: stores[0]?.name ?? 'Malika',
      contactPhone: settings.contactPhone,
      contactTelegram: settings.contactTelegram,
      showPrices: settings.showPrices,
      stores,
      categories,
      pickupEnabled: settings.pickupEnabled,
      deliveryEnabled: settings.deliveryEnabled,
      deliveryPricingMode: settings.deliveryPricingModeCode,
      deliveryFlatFee: settings.deliveryFlatFee,
      deliveryFreeFrom: settings.deliveryFreeFrom,
      deliveryNote: settings.deliveryNote,
      deliveryZones: zones.map((z) => ({
        id: z.id,
        name: z.name,
        fee: z.fee.toFixed(2),
        sortOrder: z.sortOrder,
      })),
      paymentProviders,
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

  createOrder(dto: CreateStorefrontOrderDto): Promise<{ id: string }> {
    return this.ordersService.createOrder(dto);
  }

  payOrder(
    orderId: string,
    providerCode?: string,
  ): Promise<{ checkoutUrl: string }> {
    return this.payService.payOrder(orderId, providerCode);
  }

  getPublicOrder(id: string): Promise<PublicStorefrontOrderView> {
    return this.ordersService.getPublicOrder(id);
  }

  getSettings(): Promise<StorefrontSettingsView> {
    return this.repo.getSettings();
  }

  async updateSettings(
    dto: UpdateStorefrontSettingsDto,
  ): Promise<StorefrontSettingsView> {
    const current = await this.repo.getSettings();
    const nextPickup = dto.pickupEnabled ?? current.pickupEnabled;
    const nextDelivery = dto.deliveryEnabled ?? current.deliveryEnabled;

    if (!nextPickup && !nextDelivery) {
      throw new BadRequestException({
        code: 'NEITHER_PICKUP_NOR_DELIVERY',
        message: 'Storefront cannot have both pickup and delivery disabled',
      });
    }

    return this.repo.updateSettings({
      enabled: dto.enabled,
      showPrices: dto.showPrices,
      contactPhone: dto.contactPhone,
      contactTelegram: dto.contactTelegram,
      categoryIds: dto.categoryIds,
      pickupEnabled: dto.pickupEnabled,
      deliveryEnabled: dto.deliveryEnabled,
      deliveryPricingModeCode: dto.deliveryPricingModeCode,
      deliveryFlatFee:
        dto.deliveryFlatFee !== undefined
          ? dto.deliveryFlatFee !== null
            ? dto.deliveryFlatFee.toString()
            : null
          : undefined,
      deliveryFreeFrom:
        dto.deliveryFreeFrom !== undefined
          ? dto.deliveryFreeFrom !== null
            ? dto.deliveryFreeFrom.toString()
            : null
          : undefined,
      deliveryNote: dto.deliveryNote,
    });
  }
}
