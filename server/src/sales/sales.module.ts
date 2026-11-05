import { Module } from '@nestjs/common';
import { BonusModule } from '../bonus/bonus.module.js';
import { CustomerPurchasesModule } from '../customer-purchases/customer-purchases.module.js';
import { LedgerModule } from '../ledger/ledger.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { StockModule } from '../stock/stock.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesController } from './sales.controller.js';
import { SalesCreateService } from './sales-create.service.js';
import { SalesCreditService } from './sales-credit.service.js';
import { SalesPricingService } from './sales-pricing.service.js';
import { SalesReadService } from './sales-read.service.js';
import { SalesRepository } from './sales.repository.js';
import { SalesReturnsService } from './sales-returns.service.js';
import { SalesTradeInService } from './sales-trade-in.service.js';
import { SalesService } from './sales.service.js';

@Module({
  imports: [
    StoresModule,
    LedgerModule,
    StockModule,
    PricingModule,
    SettingsModule,
    ShiftsModule,
    CustomerPurchasesModule,
    BonusModule,
  ],
  controllers: [SalesController],
  providers: [
    SalesService,
    SalesCreateService,
    SalesReadService,
    SalesRepository,
    SalesCheckoutRepository,
    SalesPricingService,
    SalesReturnsService,
    SalesTradeInService,
    SalesCreditService,
  ],
  exports: [SalesService, SalesCreditService],
})
export class SalesModule {}
