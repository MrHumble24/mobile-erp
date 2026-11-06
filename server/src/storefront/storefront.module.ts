import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SalesModule } from '../sales/sales.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { StorefrontCatalogRepository } from './storefront-catalog.repository.js';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontDeliveryZonesController } from './storefront-delivery-zones.controller.js';
import { StorefrontDeliveryZonesRepository } from './storefront-delivery-zones.repository.js';
import { StorefrontDeliveryZonesService } from './storefront-delivery-zones.service.js';
import { StorefrontOrdersController } from './storefront-orders.controller.js';
import { StorefrontOrdersFulfillService } from './storefront-orders-fulfill.service.js';
import { StorefrontOrdersRepository } from './storefront-orders.repository.js';
import { StorefrontOrdersService } from './storefront-orders.service.js';
import { StorefrontPublicOrdersService } from './storefront-public-orders.service.js';
import { StorefrontRepository } from './storefront.repository.js';
import { StorefrontSettingsRepository } from './storefront-settings.repository.js';
import { StorefrontPayService } from './storefront-pay.service.js';
import { StorefrontService } from './storefront.service.js';
import { OnlinePaymentsModule } from '../online-payments/online-payments.module.js';

@Module({
  imports: [
    PrismaModule,
    PricingModule,
    TelegramModule,
    StoresModule,
    LedgerModule,
    SalesModule,
    OnlinePaymentsModule,
  ],
  controllers: [
    StorefrontController,
    StorefrontOrdersController,
    StorefrontDeliveryZonesController,
  ],
  providers: [
    StorefrontService,
    StorefrontPublicOrdersService,
    StorefrontPayService,
    StorefrontOrdersService,
    StorefrontOrdersFulfillService,
    StorefrontDeliveryZonesService,
    StorefrontRepository,
    StorefrontSettingsRepository,
    StorefrontCatalogRepository,
    StorefrontOrdersRepository,
    StorefrontDeliveryZonesRepository,
  ],
  exports: [
    StorefrontService,
    StorefrontPayService,
    StorefrontOrdersService,
    StorefrontDeliveryZonesService,
  ],
})
export class StorefrontModule {}
