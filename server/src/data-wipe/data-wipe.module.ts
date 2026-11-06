import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BackupsModule } from '../backups/backups.module.js';
import { DeviceModelsModule } from '../device-models/device-models.module.js';
import { SetupModule } from '../setup/setup.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { DataWipeController } from './data-wipe.controller.js';
import { DataWipeRepository } from './data-wipe.repository.js';
import { DataWipeRunner } from './data-wipe.runner.js';
import { DataWipeService } from './data-wipe.service.js';

/** Danger zone: erase the shop's data and factory reset (ADR 0057, 0061).
 * Builds on the backup feature (safety backup), runtime switches (maintenance,
 * sessions, recovery), setup wizard and device-models picture storage. */
@Module({
  imports: [
    BackupsModule,
    AuthModule,
    StoresModule,
    TelegramModule,
    DeviceModelsModule,
    SetupModule,
  ],
  controllers: [DataWipeController],
  providers: [DataWipeService, DataWipeRunner, DataWipeRepository],
})
export class DataWipeModule {}
