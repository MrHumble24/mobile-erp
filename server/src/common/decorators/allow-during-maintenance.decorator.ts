import { SetMetadata } from '@nestjs/common';

export const ALLOW_DURING_MAINTENANCE_KEY = 'allow_during_maintenance';

/**
 * Lets a route answer while a restore holds maintenance (health checks and the
 * restore's own status). Every other route gets 503 MAINTENANCE.
 */
export const AllowDuringMaintenance = () =>
  SetMetadata(ALLOW_DURING_MAINTENANCE_KEY, true);
