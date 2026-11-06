import { Global, Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';

/** Cross-cutting runtime switches used by guards, crons and the restore flow. */
@Global()
@Module({
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class RuntimeModule {}
