import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { StockController } from './stock.controller.js';
import { StockRepository } from './stock.repository.js';
import { StockService } from './stock.service.js';

@Module({
  imports: [StoresModule, PricingModule],
  controllers: [StockController],
  providers: [StockService, StockRepository],
  // Exported so sales (SALE/RETURN movements) and shipments (PURCHASE) post
  // through StockService inside their own transaction — never StockRepository.
  exports: [StockService],
})
export class StockModule {}
