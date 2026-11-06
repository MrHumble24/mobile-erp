import { Module } from '@nestjs/common';
import { CompanyModule } from '../company/company.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SecretsModule } from '../secrets/secrets.module.js';
import { OnlinePaymentsConfigService } from './online-payments-config.service.js';
import { OnlinePaymentsController } from './online-payments.controller.js';
import { OnlinePaymentsRepository } from './online-payments.repository.js';
import { OnlinePaymentsService } from './online-payments.service.js';
import { PaymentExpiryCron } from './payment-expiry.cron.js';
import { ClickProvider } from './providers/click.provider.js';
import { PaymeProvider } from './providers/payme.provider.js';
import { ProviderRegistry } from './providers/provider.registry.js';

@Module({
  imports: [PrismaModule, SecretsModule, CompanyModule],
  controllers: [OnlinePaymentsController],
  providers: [
    OnlinePaymentsRepository,
    OnlinePaymentsConfigService,
    OnlinePaymentsService,
    PaymentExpiryCron,
    PaymeProvider,
    ClickProvider,
    {
      provide: ProviderRegistry,
      useFactory: (payme: PaymeProvider, click: ClickProvider) =>
        new ProviderRegistry([payme, click]),
      inject: [PaymeProvider, ClickProvider],
    },
  ],
  exports: [
    OnlinePaymentsService,
    OnlinePaymentsConfigService,
    OnlinePaymentsRepository,
    ProviderRegistry,
  ],
})
export class OnlinePaymentsModule {}
