import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessRepository } from './access.repository.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import {
  EffectiveAccess,
  PermissionView,
  RoleView,
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

  async setRolePermissions(
    code: string,
    permissionCodes: string[],
  ): Promise<RoleView> {
    if (!(await this.repo.findRole(code))) {
      throw new NotFoundException(`Role ${code} not found`);
    }
    await this.assertPermissionsExist(permissionCodes);
    await this.repo.replaceRolePermissions(code, permissionCodes);
    return (await this.repo.listRoles()).find((r) => r.code === code)!;
  }

  async deleteRole(code: string): Promise<void> {
    const role = await this.repo.findRole(code);
    if (!role) throw new NotFoundException(`Role ${code} not found`);
    if (role.isSystem) {
      throw new ForbiddenException(`System role ${code} cannot be deleted`);
    }
    if ((await this.repo.countUsersWithRole(code)) > 0) {
      throw new ConflictException(`Role ${code} is assigned to users`);
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
