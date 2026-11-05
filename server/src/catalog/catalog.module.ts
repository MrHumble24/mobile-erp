import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogRepository } from './catalog.repository.js';
import { CatalogService } from './catalog.service.js';

@Module({
  imports: [StoresModule, PricingModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository],
})
export class CatalogModule {}
