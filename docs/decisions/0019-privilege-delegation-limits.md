# 0019 — Privilege delegation limits

Date: 2026-11-02
Status: Accepted

## Context

A security audit found that `role.manage` / `user.manage` holders could escalate
privilege: rewriting any role's permissions (including `isSystem` roles) to grant
themselves anything, and resetting the owner's password to seize that account.
The last active administrator could also be locked out by deactivation or de-roling.

## Decision

- **Subset rule for delegation.** A caller may only hand out permissions in their
  own effective set. `PUT /access/roles/:code/permissions` rejects (403) any added
  code the caller lacks, mirroring the existing user-override rule. Password reset
  (`POST /users/:id/password`) is refused (403) when the target's effective
  permissions are not a subset of the caller's.
- **System roles are immutable.** `isSystem` roles cannot be renamed, re-described,
  have their permissions changed, or be deleted (403). Already enforced for delete.
- **Last-admin protection.** Deactivating, or removing the ADMIN role from, the last
  active user holding ADMIN is refused (409).

## Consequences

- Delegated admins can never exceed their own grant; the owner account stays reachable.
- Redaction of report cost/profit aliases moved to the same change (see redact.ts);
  this ADR only covers delegation.
- **Deferred:** per-user `tokenVersion` to invalidate JWTs on password reset / role
  change needs a Prisma migration and a JWT-guard check — out of scope here, follow-up.
- **Not applied:** the `multer` transitive advisory override belongs in
  `pnpm-workspace.yaml` (pnpm 12 ignores `pnpm.overrides` in package.json), which is
  outside the audit's allowed paths; left for the user to pin there.
