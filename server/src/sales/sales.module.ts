import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { StockModule } from '../stock/stock.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesController } from './sales.controller.js';
import { SalesCreditService } from './sales-credit.service.js';
import { SalesPricingService } from './sales-pricing.service.js';
import { SalesRepository } from './sales.repository.js';
import { SalesReturnsService } from './sales-returns.service.js';
import { SalesService } from './sales.service.js';

@Module({
  imports: [
    StoresModule,
    LedgerModule,
    StockModule,
    PricingModule,
    SettingsModule,
  ],
  controllers: [SalesController],
  providers: [
    SalesService,
    SalesRepository,
    SalesCheckoutRepository,
    SalesPricingService,
    SalesReturnsService,
    SalesCreditService,
  ],
  exports: [SalesService, SalesCreditService],
})
export class SalesModule {}
