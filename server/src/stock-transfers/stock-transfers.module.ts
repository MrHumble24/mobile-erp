import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { StockTransfersController } from './stock-transfers.controller.js';
import { StockTransfersRepository } from './stock-transfers.repository.js';
import { StockTransfersService } from './stock-transfers.service.js';

@Module({
  imports: [StoresModule, StockModule],
  controllers: [StockTransfersController],
  providers: [StockTransfersService, StockTransfersRepository],
  exports: [StockTransfersService],
})
export class StockTransfersModule {}
