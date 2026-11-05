import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller.js';
import { PricingRepository } from './pricing.repository.js';
import { PricingService } from './pricing.service.js';

@Module({
  controllers: [PricingController],
  providers: [PricingService, PricingRepository],
  // Exported so sales (checkout list price + discount rules), consignments
  // (default partner agreed price) and the catalog/scan/stock/sync read models
  // resolve prices through PricingService — never the repository.
  exports: [PricingService],
})
export class PricingModule {}
