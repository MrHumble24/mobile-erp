import { Global, Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';
import { RecoveryService } from './recovery.service.js';
import { SessionGateService } from './session-gate.service.js';

/** Cross-cutting runtime switches used by guards, crons and the restore flow. */
@Global()
@Module({
  providers: [MaintenanceService, SessionGateService, RecoveryService],
  exports: [MaintenanceService, SessionGateService, RecoveryService],
})
export class RuntimeModule {}
