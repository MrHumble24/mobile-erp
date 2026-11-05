import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { SalesModule } from '../sales/sales.module.js';
import { CustomersController } from './customers.controller.js';
import { CustomersRepository } from './customers.repository.js';
import { CustomersService } from './customers.service.js';

@Module({
  imports: [SalesModule, PricingModule],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
})
export class CustomersModule {}
