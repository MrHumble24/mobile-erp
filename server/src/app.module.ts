import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { ShipmentsModule } from './shipments/shipments.module.js';
import { DevicesModule } from './devices/devices.module.js';
import { QcModule } from './qc/qc.module.js';
import { StockAlertRulesModule } from './stock-alert-rules/stock-alert-rules.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { CostRedactionInterceptor } from './common/interceptors/cost-redaction.interceptor.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
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
    ShipmentsModule,
    DevicesModule,
    QcModule,
    StockAlertRulesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: CostRedactionInterceptor },
  ],
})
export class AppModule {}
