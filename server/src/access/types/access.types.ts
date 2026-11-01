export interface RoleView {
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCodes: string[];
}

export interface PermissionView {
  code: string;
  resource: string;
  action: string;
  description: string | null;
}

/** Raw inputs to the effective-permission calculation for one user. */
export interface PermissionSources {
  rolePermissionCodes: string[];
  grantedCodes: string[];
  revokedCodes: string[];
}
