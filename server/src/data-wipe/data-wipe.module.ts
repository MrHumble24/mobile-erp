import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BackupsModule } from '../backups/backups.module.js';
import { DeviceModelsModule } from '../device-models/device-models.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { DataWipeController } from './data-wipe.controller.js';
import { DataWipeRepository } from './data-wipe.repository.js';
import { DataWipeRunner } from './data-wipe.runner.js';
import { DataWipeService } from './data-wipe.service.js';

/** Danger zone: erase the shop's data (ADR 0057). Builds on the backup feature
 * (safety backup), the runtime switches (maintenance, sessions, recovery) and
 * the device-models picture storage — reused through their public services. */
@Module({
  imports: [
    BackupsModule,
    AuthModule,
    StoresModule,
    TelegramModule,
    DeviceModelsModule,
  ],
  controllers: [DataWipeController],
  providers: [DataWipeService, DataWipeRunner, DataWipeRepository],
})
export class DataWipeModule {}
