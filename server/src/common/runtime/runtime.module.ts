import { Global, Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service.js';
import { SessionGateService } from './session-gate.service.js';

/** Cross-cutting runtime switches used by guards, crons and the restore flow. */
@Global()
@Module({
  providers: [MaintenanceService, SessionGateService],
  exports: [MaintenanceService, SessionGateService],
})
export class RuntimeModule {}
