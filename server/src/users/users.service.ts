import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AccessService } from '../access/access.service.js';
import {
  RoleView,
  UserPermissionBreakdown,
} from '../access/types/access.types.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import {
  PermissionOverrideDto,
  SetPermissionsDto,
} from './dto/set-permissions.dto.js';
import { SetRolesDto } from './dto/set-roles.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersRepository } from './users.repository.js';
import {
  PaginatedUsers,
  UserListFilters,
  UserView,
} from './types/user.types.js';

const ADMIN_ROLE = 'ADMIN';

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly access: AccessService,
  ) {}

  list(filters: UserListFilters): Promise<PaginatedUsers> {
    return this.repo.findPage(filters);
  }

  async stats(): Promise<{
    total: number;
    active: number;
    byRole: Record<string, number>;
  }> {
    const [{ total, active }, byRole] = await Promise.all([
      this.repo.countActive(),
      this.repo.countByRole(),
    ]);
    return { total, active, byRole };
  }

  async get(id: string): Promise<UserView> {
    return this.require(id);
  }

  async getEffectivePermissions(id: string): Promise<UserPermissionBreakdown> {
    await this.require(id);
    return this.access.describeUser(id);
  }

  async resetPassword(
    caller: AuthenticatedUser,
    id: string,
    password: string,
  ): Promise<void> {
    await this.require(id);
    await this.assertTargetWithinCallerScope(caller, id);
    const passwordHash = await argon2.hash(password);
    await this.repo.setPassword(id, passwordHash);
  }

  async create(
    caller: AuthenticatedUser,
    dto: CreateUserDto,
  ): Promise<UserView> {
    const roles = await this.access.listRoles();
    this.assertRolesKnown(roles, dto.roleCodes);
    this.assertCanAssignRoles(caller, roles, dto.roleCodes);
    const passwordHash = await argon2.hash(dto.password);
    return this.repo.create({
      email: dto.email,
      passwordHash,
      profile: dto.profile,
      roleCodes: dto.roleCodes,
    });
  }

  async update(
    caller: AuthenticatedUser,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserView> {
    if (caller.id === id && dto.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    const target = await this.require(id);
    if (dto.isActive === false) await this.assertNotLastAdmin(id, target);
    return this.repo.update(id, dto);
  }

  async setRoles(
    caller: AuthenticatedUser,
    id: string,
    dto: SetRolesDto,
  ): Promise<UserView> {
    this.assertNotSelf(caller, id, 'roles');
    const target = await this.require(id);
    const roles = await this.access.listRoles();
    this.assertRolesKnown(roles, dto.roleCodes);
    this.assertCanAssignRoles(caller, roles, dto.roleCodes);
    if (!dto.roleCodes.includes(ADMIN_ROLE)) {
      await this.assertNotLastAdmin(id, target);
    }
    return this.repo.setRoles(id, dto.roleCodes);
  }

  async setPermissions(
    caller: AuthenticatedUser,
    id: string,
    dto: SetPermissionsDto,
  ): Promise<UserView> {
    this.assertNotSelf(caller, id, 'permissions');
    await this.require(id);
    await this.assertPermissionsExist(
      dto.overrides.map((o) => o.permissionCode),
    );
    this.assertCanGrantPermissions(caller, dto.overrides);
    await this.repo.setPermissions(id, dto.overrides);
    return this.require(id);
  }

  private async require(id: string): Promise<UserView> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  /**
   * A caller may only reset the password of a user whose effective permissions
   * are a subset of their own — otherwise `user.manage` lets anyone seize a more
   * privileged account (e.g. the owner) by resetting its password.
   */
  private async assertTargetWithinCallerScope(
    caller: AuthenticatedUser,
    id: string,
  ): Promise<void> {
    const targetPerms = await this.access.getEffectivePermissions(id);
    const beyond = [...targetPerms].filter((p) => !caller.permissions.has(p));
    if (beyond.length > 0) {
      throw new ForbiddenException(
        `Cannot reset the password of a user holding permissions you lack: ${beyond.join(', ')}`,
      );
    }
  }

  /** Refuse to strip the last active ADMIN of their access (deactivate / de-role). */
  private async assertNotLastAdmin(
    id: string,
    target: UserView,
  ): Promise<void> {
    if (!target.isActive || !target.roles.includes(ADMIN_ROLE)) return;
    if ((await this.repo.countOtherActiveAdmins(id)) === 0) {
      throw new ConflictException(
        'Cannot remove the last active administrator',
      );
    }
  }

  private assertNotSelf(
    caller: AuthenticatedUser,
    id: string,
    what: string,
  ): void {
    if (caller.id === id) {
      throw new ForbiddenException(`You cannot change your own ${what}`);
    }
  }

  /** A caller may only hand out permissions they themselves hold. */
  private assertCanAssignRoles(
    caller: AuthenticatedUser,
    roles: RoleView[],
    roleCodes: string[],
  ): void {
    const byCode = new Map(roles.map((r) => [r.code, r]));
    for (const code of roleCodes) {
      const missing = (byCode.get(code)?.permissionCodes ?? []).filter(
        (p) => !caller.permissions.has(p),
      );
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Cannot assign role ${code}: it grants permissions you lack (${missing.join(', ')})`,
        );
      }
    }
  }

  private assertCanGrantPermissions(
    caller: AuthenticatedUser,
    overrides: PermissionOverrideDto[],
  ): void {
    const escalating = overrides
      .filter((o) => o.granted && !caller.permissions.has(o.permissionCode))
      .map((o) => o.permissionCode);
    if (escalating.length > 0) {
      throw new ForbiddenException(
        `Cannot grant permissions you lack: ${escalating.join(', ')}`,
      );
    }
  }

  private assertRolesKnown(roles: RoleView[], codes: string[]): void {
    const known = new Set(roles.map((r) => r.code));
    const unknown = codes.filter((c) => !known.has(c));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown roles: ${unknown.join(', ')}`);
    }
  }

  private async assertPermissionsExist(codes: string[]): Promise<void> {
    const known = new Set(
      (await this.access.listPermissions()).map((p) => p.code),
    );
    const unknown = codes.filter((c) => !known.has(c));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown permissions: ${unknown.join(', ')}`,
      );
    }
  }
}
