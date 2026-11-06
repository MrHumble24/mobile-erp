import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_DURING_MAINTENANCE_KEY } from '../decorators/allow-during-maintenance.decorator.js';
import { MaintenanceService } from '../runtime/maintenance.service.js';

/**
 * While a restore runs, every route answers 503 MAINTENANCE except those marked
 * `@AllowDuringMaintenance()` (health and the restore's own status). Runs before
 * the auth guards so even anonymous traffic is turned away.
 */
@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly maintenance: MaintenanceService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (!this.maintenance.isActive()) return true;
    const allowed = this.reflector.getAllAndOverride<boolean>(
      ALLOW_DURING_MAINTENANCE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (allowed) return true;
    throw new ServiceUnavailableException({
      code: 'MAINTENANCE',
      message: 'The system is restoring a backup; try again shortly',
    });
  }
}
