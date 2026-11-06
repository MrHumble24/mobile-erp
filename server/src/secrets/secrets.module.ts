import { Global, Module } from '@nestjs/common';
import { AppKeyService } from './app-key.service.js';
import { SecretsRepository } from './secrets.repository.js';
import { SecretsService } from './secrets.service.js';

/** Global so any module (backups now, first-boot setup later) can seal/read. */
@Global()
@Module({
  providers: [SecretsService, SecretsRepository, AppKeyService],
  exports: [SecretsService, AppKeyService],
})
export class SecretsModule {}
