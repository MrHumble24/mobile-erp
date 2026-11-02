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
  /** false when the user is disabled or no longer exists. */
  isActive: boolean;
  rolePermissionCodes: string[];
  grantedCodes: string[];
  revokedCodes: string[];
}

/** Account state plus resolved permissions, loaded in one query per request. */
export interface EffectiveAccess {
  isActive: boolean;
  permissions: Set<string>;
}

/** Which roles grant a given permission to a user (for the override UI source). */
export interface RoleGrant {
  permissionCode: string;
  roleCodes: string[];
}

/** Full picture of one user's permissions: roles, role grants, overrides, net. */
export interface UserPermissionBreakdown {
  roles: string[];
  roleGrants: RoleGrant[];
  overrides: {
    permissionCode: string;
    granted: boolean;
    reason: string | null;
  }[];
  /** (union of role grants ∪ user grants) − user revokes. */
  effective: string[];
}
