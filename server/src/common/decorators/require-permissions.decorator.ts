import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';
export const PERMISSIONS_ANY_KEY = 'requiredAnyPermissions';

/** Guards a route requiring ALL of the given `<resource>.<action>` permission codes. */
export const RequirePermissions = (...codes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codes);

/** Guards a route requiring AT LEAST ONE of the given permission codes. */
export const RequireAnyPermissions = (...codes: string[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, codes);
