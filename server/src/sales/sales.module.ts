import { Module } from '@nestjs/common';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesController } from './sales.controller.js';
import { SalesRepository } from './sales.repository.js';
import { SalesService } from './sales.service.js';

@Module({
  controllers: [SalesController],
  providers: [SalesService, SalesRepository, SalesCheckoutRepository],
  exports: [SalesService],
})
export class SalesModule {}
