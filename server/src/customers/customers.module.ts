import { Module } from '@nestjs/common';
import { SalesModule } from '../sales/sales.module.js';
import { CustomersController } from './customers.controller.js';
import { CustomersRepository } from './customers.repository.js';
import { CustomersService } from './customers.service.js';

@Module({
  imports: [SalesModule],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersRepository],
})
export class CustomersModule {}
