import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { BonusController } from './bonus.controller.js';
import { BonusRepository } from './bonus.repository.js';
import { BonusService } from './bonus.service.js';

@Module({
  imports: [SettingsModule, StoresModule],
  controllers: [BonusController],
  providers: [BonusService, BonusRepository],
  // Sales plan/post points inside their transaction; customers show the balance.
  exports: [BonusService],
})
export class BonusModule {}
