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
import { OauthController } from './providers/oauth.controller.js';
import { OauthService } from './providers/oauth.service.js';
import { ProviderDestination } from './providers/provider-destination.js';
import { ProviderSecrets } from './providers/provider-secrets.js';
import { ProvidersController } from './providers/providers.controller.js';
import { ProvidersRepository } from './providers/providers.repository.js';
import { ProvidersService } from './providers/providers.service.js';
import { RestoreController } from './restore.controller.js';
import { RestoreRepository } from './restore.repository.js';
import { RestoreRunner } from './restore-runner.js';
import { RestoreService } from './restore.service.js';
import { UploadStagingService } from './upload-staging.service.js';
import type { BackupStorage } from './storage/backup-storage.js';
import { GoogleDriveStorage } from './storage/google-drive.storage.js';
import { LocalStorage } from './storage/local.storage.js';
import { OneDriveStorage } from './storage/onedrive.storage.js';
import { StorageRegistry } from './storage/storage.registry.js';
import { TelegramStorage } from './storage/telegram.storage.js';

/**
 * The storage adapters this server ships. To add a provider: write one adapter
 * implementing BackupStorage, add its class to this one array, add one
 * `backup_providers` row (and its secret kinds to provider-secrets.ts). No switch.
 */
const STORAGE_ADAPTERS = [
  LocalStorage,
  TelegramStorage,
  GoogleDriveStorage,
  OneDriveStorage,
];

/** Backups & restore with storage providers (handoff 023, ADR 0051). */
@Module({
  imports: [TelegramModule, AuthModule, StoresModule],
  controllers: [
    BackupsController,
    RestoreController,
    ProvidersController,
    OauthController,
  ],
  providers: [
    BackupsService,
    RestoreService,
    RestoreRunner,
    BackupRunner,
    BackupsReconciler,
    BackupsRepository,
    RestoreRepository,
    BackupsCron,
    UploadStagingService,
    ProvidersRepository,
    ProvidersService,
    ProviderSecrets,
    ProviderDestination,
    OauthService,
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
