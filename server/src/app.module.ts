import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AccessModule } from './access/access.module.js';
import { UsersModule } from './users/users.module.js';
import { PartnersModule } from './partners/partners.module.js';
import { ConsignmentsModule } from './consignments/consignments.module.js';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { SalesModule } from './sales/sales.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { DeviceModelsModule } from './device-models/device-models.module.js';
import { ProductCategoriesModule } from './product-categories/product-categories.module.js';
import { ShipmentsModule } from './shipments/shipments.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { QcModule } from './qc/qc.module.js';
import { StockAlertRulesModule } from './stock-alert-rules/stock-alert-rules.module.js';
import { SyncModule } from './sync/sync.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { StoresModule } from './stores/stores.module.js';
import { StockTransfersModule } from './stock-transfers/stock-transfers.module.js';
import { LedgerModule } from './ledger/ledger.module.js';
import { CustomsModule } from './customs/customs.module.js';
import { StockModule } from './stock/stock.module.js';
import { ScanModule } from './scan/scan.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { LookupModule } from './lookup/lookup.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { CreditsModule } from './credits/credits.module.js';
import { ShiftsModule } from './shifts/shifts.module.js';
import { CustomerPurchasesModule } from './customer-purchases/customer-purchases.module.js';
import { RepairsModule } from './repairs/repairs.module.js';
import { BonusModule } from './bonus/bonus.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { CostRedactionInterceptor } from './common/interceptors/cost-redaction.interceptor.js';
import { StoreInterceptor } from './common/interceptors/store.interceptor.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    AccessModule,
    UsersModule,
    PartnersModule,
    ConsignmentsModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    SettingsModule,
    ReportsModule,
    SalesModule,
    CustomersModule,
    SuppliersModule,
    DeviceModelsModule,
    ProductCategoriesModule,
    ShipmentsModule,
    DevicesModule,
    QcModule,
    StockAlertRulesModule,
    SyncModule,
    TelegramModule,
    StoresModule,
    StockTransfersModule,
    LedgerModule,
    CustomsModule,
    StockModule,
    ScanModule,
    CatalogModule,
    LookupModule,
    PricingModule,
    CreditsModule,
    ShiftsModule,
    CustomerPurchasesModule,
    RepairsModule,
    BonusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: StoreInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CostRedactionInterceptor },
  ],
})
export class AppModule {}
