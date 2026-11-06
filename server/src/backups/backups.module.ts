import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { BackupRunner } from './backup-runner.js';
import { BackupsController } from './backups.controller.js';
import { BackupsCron } from './backups.cron.js';
import { BackupsReconciler } from './backups-reconcile.service.js';
import { BackupsRepository } from './backups.repository.js';
import { BackupsService } from './backups.service.js';
import { RestoreController } from './restore.controller.js';
import { RestoreRunner } from './restore-runner.js';
import { RestoreService } from './restore.service.js';
import { UploadStagingService } from './upload-staging.service.js';
import type { BackupStorage } from './storage/backup-storage.js';
import { LocalStorage } from './storage/local.storage.js';
import { StorageRegistry } from './storage/storage.registry.js';

/**
 * The storage adapters this server ships. To add a provider: write one adapter
 * file implementing BackupStorage, add its class to this one array, and add one
 * row to the backup_providers lookup. Nothing else changes — no switch anywhere.
 */
const STORAGE_ADAPTERS = [LocalStorage];

/** Backups & restore (handoff 023, ADR 0051). */
@Module({
  imports: [TelegramModule, AuthModule, StoresModule],
  controllers: [BackupsController, RestoreController],
  providers: [
    BackupsService,
    RestoreService,
    RestoreRunner,
    BackupRunner,
    BackupsReconciler,
    BackupsRepository,
    BackupsCron,
    UploadStagingService,
    ...STORAGE_ADAPTERS,
    {
      provide: StorageRegistry,
      useFactory: (...adapters: BackupStorage[]) =>
        new StorageRegistry(adapters),
      inject: STORAGE_ADAPTERS,
    },
  ],
  exports: [BackupsService, BackupsRepository, StorageRegistry],
})
export class BackupsModule {}
