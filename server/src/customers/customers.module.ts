import { Module } from '@nestjs/common';
import { BonusModule } from '../bonus/bonus.module.js';
import { CreditsModule } from '../credits/credits.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { SalesModule } from '../sales/sales.module.js';
import { CustomersController } from './customers.controller.js';
import { CustomersRepository } from './customers.repository.js';
import { CustomersService } from './customers.service.js';

@Module({
  imports: [SalesModule, PricingModule, CreditsModule, BonusModule],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
})
export class CustomersModule {}
