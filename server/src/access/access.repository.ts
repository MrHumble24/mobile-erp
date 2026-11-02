import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  PermissionSources,
  PermissionView,
  RoleGrant,
  RoleView,
} from './types/access.types.js';

/** All Prisma access for roles, permissions and user overrides. */
@Injectable()
export class AccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One query: account state, role permissions and per-user overrides. */
  async getPermissionSources(userId: string): Promise<PermissionSources> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        roles: {
          select: {
            role: {
              select: { permissions: { select: { permissionCode: true } } },
            },
          },
        },
        permissions: { select: { permissionCode: true, granted: true } },
      },
    });
    if (!user) {
      return {
        isActive: false,
        rolePermissionCodes: [],
        grantedCodes: [],
        revokedCodes: [],
      };
    }

    return {
      isActive: user.isActive,
      rolePermissionCodes: user.roles.flatMap((r) =>
        r.role.permissions.map((p) => p.permissionCode),
      ),
      grantedCodes: user.permissions
        .filter((o) => o.granted)
        .map((o) => o.permissionCode),
      revokedCodes: user.permissions
        .filter((o) => !o.granted)
        .map((o) => o.permissionCode),
    };
  }

  countUsersWithRole(code: string): Promise<number> {
    return this.prisma.userRole.count({ where: { roleCode: code } });
  }

  /** Roles, their grants (attributed per role) and per-user overrides. */
  async getUserAccessDetail(userId: string): Promise<{
    roles: string[];
    roleGrants: RoleGrant[];
    overrides: {
      permissionCode: string;
      granted: boolean;
      reason: string | null;
    }[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: {
          select: {
            roleCode: true,
            role: {
              select: { permissions: { select: { permissionCode: true } } },
            },
          },
        },
        permissions: {
          select: { permissionCode: true, granted: true, reason: true },
        },
      },
    });
    if (!user) return { roles: [], roleGrants: [], overrides: [] };

    const byPermission = new Map<string, Set<string>>();
    for (const ur of user.roles) {
      for (const p of ur.role.permissions) {
        const set = byPermission.get(p.permissionCode) ?? new Set<string>();
        set.add(ur.roleCode);
        byPermission.set(p.permissionCode, set);
      }
    }
    return {
      roles: user.roles.map((r) => r.roleCode),
      roleGrants: [...byPermission].map(([permissionCode, roleCodes]) => ({
        permissionCode,
        roleCodes: [...roleCodes],
      })),
      overrides: user.permissions,
    };
  }

  async listRoles(): Promise<RoleView[]> {
    const rows = await this.prisma.role.findMany({
      orderBy: { code: 'asc' },
      include: { permissions: { select: { permissionCode: true } } },
    });
    return rows.map((r) => ({
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissionCodes: r.permissions.map((p) => p.permissionCode),
    }));
  }

  async listPermissions(): Promise<PermissionView[]> {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      select: { code: true, resource: true, action: true, description: true },
    });
  }

  async findRole(
    code: string,
  ): Promise<{ code: string; isSystem: boolean } | null> {
    return this.prisma.role.findUnique({
      where: { code },
      select: { code: true, isSystem: true },
    });
  }

  async createRole(input: {
    code: string;
    name: string;
    description?: string;
  }): Promise<RoleView> {
    const r = await this.prisma.role.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
      },
    });
    return {
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissionCodes: [],
    };
  }

  async renameRole(
    code: string,
    data: { name?: string; description?: string },
  ): Promise<RoleView> {
    await this.prisma.role.update({ where: { code }, data });
    return (await this.listRoles()).find((r) => r.code === code)!;
  }

  async replaceRolePermissions(
    code: string,
    permissionCodes: string[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleCode: code } }),
      this.prisma.rolePermission.createMany({
        data: permissionCodes.map((permissionCode) => ({
          roleCode: code,
          permissionCode,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  async deleteRole(code: string): Promise<void> {
    await this.prisma.role.delete({ where: { code } });
  }
}
