import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { StorefrontOrdersController } from './storefront-orders.controller.js';
import { StorefrontOrdersRepository } from './storefront-orders.repository.js';
import { StorefrontOrdersService } from './storefront-orders.service.js';
import { StorefrontCatalogRepository } from './storefront-catalog.repository.js';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontRepository } from './storefront.repository.js';
import { StorefrontService } from './storefront.service.js';

@Module({
  imports: [PrismaModule, PricingModule, TelegramModule, StoresModule],
  controllers: [StorefrontController, StorefrontOrdersController],
  providers: [
    StorefrontService,
    StorefrontOrdersService,
    StorefrontRepository,
    StorefrontCatalogRepository,
    StorefrontOrdersRepository,
  ],
  exports: [StorefrontService, StorefrontOrdersService],
})
export class StorefrontModule {}
