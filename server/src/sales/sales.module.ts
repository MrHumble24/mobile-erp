import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesController } from './sales.controller.js';
import { SalesRepository } from './sales.repository.js';
import { SalesService } from './sales.service.js';

@Module({
  imports: [StoresModule],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository, SalesCheckoutRepository],
  exports: [SalesService],
})
export class SalesModule {}
