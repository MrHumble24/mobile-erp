import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { AccessRepository } from './access.repository.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import {
  EffectiveAccess,
  PermissionView,
  RoleView,
  UserPermissionBreakdown,
} from './types/access.types.js';

@Injectable()
export class AccessService {
  constructor(private readonly repo: AccessRepository) {}

  /**
   * Account state + effective set in one query. Effective set =
   * (union of every role's permissions ∪ user grants) − user revokes. A revoke
   * always wins over a role grant and a user grant.
   */
  async getEffectiveAccess(userId: string): Promise<EffectiveAccess> {
    const { isActive, rolePermissionCodes, grantedCodes, revokedCodes } =
      await this.repo.getPermissionSources(userId);
    const permissions = new Set([...rolePermissionCodes, ...grantedCodes]);
    for (const code of revokedCodes) permissions.delete(code);
    return { isActive, permissions };
  }

  async getEffectivePermissions(userId: string): Promise<Set<string>> {
    return (await this.getEffectiveAccess(userId)).permissions;
  }

  /** Per-permission breakdown (role grants, overrides, net) for the user UI. */
  async describeUser(userId: string): Promise<UserPermissionBreakdown> {
    const detail = await this.repo.getUserAccessDetail(userId);
    const effective = new Set(detail.roleGrants.map((g) => g.permissionCode));
    for (const o of detail.overrides) {
      if (o.granted) effective.add(o.permissionCode);
      else effective.delete(o.permissionCode);
    }
    return { ...detail, effective: [...effective] };
  }

  listRoles(): Promise<RoleView[]> {
    return this.repo.listRoles();
  }

  listPermissions(): Promise<PermissionView[]> {
    return this.repo.listPermissions();
  }

  async createRole(dto: CreateRoleDto): Promise<RoleView> {
    if (await this.repo.findRole(dto.code)) {
      throw new ConflictException(`Role ${dto.code} already exists`);
    }
    return this.repo.createRole(dto);
  }

  async renameRole(
    code: string,
    data: { name?: string; description?: string },
  ): Promise<RoleView> {
    const role = await this.repo.findRole(code);
    if (!role) throw new NotFoundException(`Role ${code} not found`);
    if (role.isSystem) {
      throw new ForbiddenException(`System role ${code} cannot be modified`);
    }
    return this.repo.renameRole(code, data);
  }

  async setRolePermissions(
    caller: AuthenticatedUser,
    code: string,
    permissionCodes: string[],
  ): Promise<RoleView> {
    const role = await this.repo.findRole(code);
    if (!role) throw new NotFoundException(`Role ${code} not found`);
    if (role.isSystem) {
      throw new ForbiddenException(
        `System role ${code} permissions cannot be changed`,
      );
    }
    await this.assertPermissionsExist(permissionCodes);
    this.assertCallerHolds(caller, permissionCodes);
    await this.repo.replaceRolePermissions(code, permissionCodes);
    return (await this.repo.listRoles()).find((r) => r.code === code)!;
  }

  /** A caller may only put permissions they themselves hold onto a role. */
  private assertCallerHolds(
    caller: AuthenticatedUser,
    permissionCodes: string[],
  ): void {
    const missing = permissionCodes.filter((c) => !caller.permissions.has(c));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Cannot grant permissions you lack: ${missing.join(', ')}`,
      );
    }
  }

  async deleteRole(code: string): Promise<void> {
    const role = await this.repo.findRole(code);
    if (!role) throw new NotFoundException(`Role ${code} not found`);
    if (role.isSystem) {
      throw new ForbiddenException(`System role ${code} cannot be deleted`);
    }
    const assignedUsers = await this.repo.countUsersWithRole(code);
    if (assignedUsers > 0) {
      throw new ConflictException({
        message: `Role ${code} is assigned to ${assignedUsers} user(s)`,
        assignedUsers,
      });
    }
    await this.repo.deleteRole(code);
  }

  private async assertPermissionsExist(codes: string[]): Promise<void> {
    const known = new Set(
      (await this.repo.listPermissions()).map((p) => p.code),
    );
    const unknown = codes.filter((c) => !known.has(c));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown permissions: ${unknown.join(', ')}`,
      );
    }
  }
}
