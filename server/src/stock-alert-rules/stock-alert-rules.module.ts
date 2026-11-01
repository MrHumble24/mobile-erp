import { Module } from '@nestjs/common';
import { DeviceModelsModule } from '../device-models/device-models.module.js';
import { StockAlertRulesController } from './stock-alert-rules.controller.js';
import { StockAlertRulesRepository } from './stock-alert-rules.repository.js';
import { StockAlertRulesService } from './stock-alert-rules.service.js';

@Module({
  imports: [DeviceModelsModule],
  controllers: [StockAlertRulesController],
  providers: [StockAlertRulesService, StockAlertRulesRepository],
})
export class StockAlertRulesModule {}
