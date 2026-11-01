/** Request-scoped identity attached by the auth guards. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  /** Effective permission codes, loaded fresh per request by PermissionsGuard. */
  permissions: Set<string>;
}
